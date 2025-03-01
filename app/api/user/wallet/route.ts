import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { createServiceRoleClient } from '../../../../src/utils/supabase';
import crypto from 'crypto';
import { getUserWalletAddress, getUserBalance } from '../../../../src/utils/blockchainAgent';

// Initialize Privy client with your app secret
const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string
);

// Function to encrypt the private key
function encryptPrivateKey(privateKey: string, userId: string): string {
  // Use a combination of the user ID and a server secret for the encryption key
  // In a production environment, you should use a more secure key management system
  const encryptionKey = crypto
    .createHash('sha256')
    .update(userId + process.env.PRIVY_APP_SECRET)
    .digest('hex')
    .substring(0, 32); // Use first 32 bytes for AES-256

  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

// Function to decrypt the private key
function decryptPrivateKey(encryptedData: string, userId: string): string {
  // Use the same key derivation as in encryption
  const encryptionKey = crypto
    .createHash('sha256')
    .update(userId + process.env.PRIVY_APP_SECRET)
    .digest('hex')
    .substring(0, 32);

  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Verify the Privy token and get the user ID
async function verifyPrivyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }
  
  const token = authHeader.replace('Bearer ', '');
  return await privyClient.verifyAuthToken(token);
}

// POST endpoint to store a private key
export async function POST(request: NextRequest) {
  try {
    // Verify the user's token
    const verifiedClaims = await verifyPrivyToken(request);
    const userId = verifiedClaims.userId;
    
    // Get the private key from the request body
    const { privateKey, walletAddress } = await request.json();
    
    if (!privateKey || !walletAddress) {
      return NextResponse.json(
        { error: 'Private key and wallet address are required' },
        { status: 400 }
      );
    }
    
    // Encrypt the private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey, userId);
    
    // Store in Supabase
    const supabase = createServiceRoleClient();
    
    const { data, error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        wallet_address: walletAddress,
        encrypted_private_key: encryptedPrivateKey,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      console.error('Error storing private key:', error);
      return NextResponse.json(
        { error: 'Failed to store private key' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Private key stored successfully',
      walletAddress
    });
    
  } catch (error) {
    console.error('Error in POST /api/user/wallet:', error);
    return NextResponse.json(
      { error: 'Unauthorized or server error', details: error },
      { status: 401 }
    );
  }
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
    console.error('Error in GET /api/user/wallet:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet information', details: error },
      { status: 500 }
    );
  }
} 