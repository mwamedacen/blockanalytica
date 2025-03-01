import { NextRequest, NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client with your app secret
const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string
);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    // If no auth header is present, return unauthorized
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Privy
    const verifiedClaims = await privyClient.verifyAuthToken(token);
    
    // If verification is successful, return the user data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: verifiedClaims.userId,
        // Return the full claims object for debugging
        claims: verifiedClaims
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Invalid or expired token', details: error },
      { status: 401 }
    );
  }
} 