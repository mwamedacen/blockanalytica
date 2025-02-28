'use client';
 
import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains'; // add baseSepolia for testing 
 
export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'ntBs8y178W5eiLMELXUkO-2A3QDMat-7'} 
      chain={base} // add baseSepolia for testing 
    >
      {props.children}
    </OnchainKitProvider>
  );
}
