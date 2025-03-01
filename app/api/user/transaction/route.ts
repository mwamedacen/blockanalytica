import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { sendTransaction, callContract, getTransactionStatus, updateTransactionStatus } from '../../../../src/utils/blockchainAgent';
import { createServiceRoleClient } from '../../../../src/utils/supabase';

// Initialize Privy client with your app secret
const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string
);

// Verify the Privy token and get the user ID
async function verifyPrivyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }
  
  const token = authHeader.replace('Bearer ', '');
  return await privyClient.verifyAuthToken(token);
}

// POST endpoint to send a transaction
export async function POST(request: NextRequest) {
  try {
    // Verify the user's token
    const verifiedClaims = await verifyPrivyToken(request);
    const userId = verifiedClaims.userId;
    
    // Parse the request body
    const body = await request.json();
    const { network, toAddress, amount, contractAddress, abi, functionName, args, value } = body;
    
    // Validate required fields
    if (!network) {
      return NextResponse.json(
        { error: 'Network is required' },
        { status: 400 }
      );
    }
    
    let txHash;
    
    // If contractAddress is provided, call a contract
    if (contractAddress) {
      if (!abi || !functionName || !args) {
        return NextResponse.json(
          { error: 'Contract address, ABI, function name, and arguments are required for contract calls' },
          { status: 400 }
        );
      }
      
      txHash = await callContract(
        userId,
        network,
        contractAddress,
        abi,
        functionName,
        args,
        value
      );
    } 
    // Otherwise, send a regular transaction
    else {
      if (!toAddress || !amount) {
        return NextResponse.json(
          { error: 'To address and amount are required for regular transactions' },
          { status: 400 }
        );
      }
      
      txHash = await sendTransaction(
        userId,
        network,
        toAddress,
        amount
      );
    }
    
    // Return the transaction hash
    return NextResponse.json({
      success: true,
      txHash
    });
    
  } catch (error) {
    console.error('Error in POST /api/user/transaction:', error);
    return NextResponse.json(
      { error: 'Failed to send transaction', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint to get transaction status
export async function GET(request: NextRequest) {
  try {
    // Verify the user's token
    const verifiedClaims = await verifyPrivyToken(request);
    const userId = verifiedClaims.userId;
    
    // Get the transaction hash and network from the query params
    const url = new URL(request.url);
    const txHash = url.searchParams.get('txHash');
    const network = url.searchParams.get('network');
    
    // Validate required fields
    if (!txHash || !network) {
      return NextResponse.json(
        { error: 'Transaction hash and network are required' },
        { status: 400 }
      );
    }
    
    // Verify that the transaction belongs to the user
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', txHash)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Transaction not found or does not belong to user' },
        { status: 404 }
      );
    }
    
    // Update the transaction status
    const status = await updateTransactionStatus(txHash, network as any);
    
    // Return the transaction status
    return NextResponse.json({
      success: true,
      transaction: {
        ...data,
        status
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/user/transaction:', error);
    return NextResponse.json(
      { error: 'Failed to get transaction status', details: error },
      { status: 500 }
    );
  }
} 