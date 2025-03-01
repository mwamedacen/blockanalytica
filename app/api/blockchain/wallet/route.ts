import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { getUserWalletAddress, getUserBalance } from '../../../../src/utils/blockchainAgent';

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

// GET endpoint to get wallet information
export async function GET(request: NextRequest) {
  try {
    // Verify the user's token
    const verifiedClaims = await verifyPrivyToken(request);
    const userId = verifiedClaims.userId;
    
    // Get the network from the query params
    const url = new URL(request.url);
    const network = url.searchParams.get('network') || 'ethereum';
    
    // Get the wallet address
    const walletAddress = await getUserWalletAddress(userId);
    
    // Get the wallet balance
    const balance = await getUserBalance(userId, network as any);
    
    // Return the wallet information
    return NextResponse.json({
      success: true,
      wallet: {
        address: walletAddress,
        balance,
        network
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/blockchain/wallet:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet information', details: error },
      { status: 500 }
    );
  }
} 