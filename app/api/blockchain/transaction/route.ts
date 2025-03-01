import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { sendTransaction, callContract } from '../../../../src/utils/blockchainAgent';
import { ethers } from 'ethers';

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
    
    // Get transaction details from the request body
    const { network, to, value, data, contractAddress, abi, method, args } = await request.json();
    
    // Validate required fields
    if (!network) {
      return NextResponse.json(
        { error: 'Network is required' },
        { status: 400 }
      );
    }
    
    let txResponse;
    
    // If contractAddress is provided, call a contract
    if (contractAddress && method) {
      if (!abi) {
        return NextResponse.json(
          { error: 'ABI is required for contract calls' },
          { status: 400 }
        );
      }
      
      txResponse = await callContract(
        userId,
        network,
        contractAddress,
        abi,
        method,
        args || []
      );
    } 
    // Otherwise, send a regular transaction
    else {
      if (!to) {
        return NextResponse.json(
          { error: 'Recipient address is required' },
          { status: 400 }
        );
      }
      
      if (!value && !data) {
        return NextResponse.json(
          { error: 'Either value or data is required' },
          { status: 400 }
        );
      }
      
      txResponse = await sendTransaction(
        userId,
        network,
        to,
        value || '0',
        data
      );
    }
    
    // Return the transaction response
    return NextResponse.json({
      success: true,
      txHash: txResponse.hash,
      txResponse: {
        hash: txResponse.hash,
        from: txResponse.from,
        to: txResponse.to,
        value: txResponse.value ? ethers.formatEther(txResponse.value) : '0',
        data: txResponse.data,
      }
    });
    
  } catch (error) {
    console.error('Error in POST /api/blockchain/transaction:', error);
    return NextResponse.json(
      { error: 'Failed to send transaction', details: error },
      { status: 500 }
    );
  }
} 