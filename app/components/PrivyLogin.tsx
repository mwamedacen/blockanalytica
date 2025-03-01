'use client';

import { getAccessToken, usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export function PrivyLogin() {
  const { login, logout, authenticated, user } = usePrivy();
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    async function verifyUserToken() {
      if (authenticated) {
        try {
          const accessToken = await getAccessToken();
          const response = await fetch('/api/verify', {
            headers: {
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          });
          
          const result = await response.json();
          setVerificationResult(result);
          console.log('Token verification result:', result);
        } catch (error) {
          console.error('Error verifying token:', error);
        }
      }
    }
    
    verifyUserToken();
  }, [authenticated]);

  if (authenticated) {
    return (
      <div className="privy-auth-container">
        <div className="privy-user-info">
          <span>{user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4) || 'Authenticated'}</span>
        </div>
        <button 
          onClick={logout}
          className="privy-button"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={login}
      className="privy-button"
    >
      Login
    </button>
  );
} 