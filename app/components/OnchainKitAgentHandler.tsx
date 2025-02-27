'use client';

import React, { useState, useEffect } from 'react';
import { 
  WalletDefault, 
  WalletDropdown 
} from '@coinbase/onchainkit/wallet';
import { 
  SwapDefault, 
  SwapAmountInput, 
  SwapButton 
} from '@coinbase/onchainkit/swap';
import { 
  Transaction 
} from '@coinbase/onchainkit/transaction';
import { 
  Identity, 
  Avatar, 
  Name 
} from '@coinbase/onchainkit/identity';

// Define the OnchainKit agent response type
interface OnchainKitAgentResponse {
  agentName: string;
  message: string;
  data: {
    intent: string;
    component: string;
    config: any;
    action: string;
  };
}

interface OnchainKitAgentHandlerProps {
  agentResponse: OnchainKitAgentResponse | null;
  onActionComplete?: (result: any) => void;
}

export default function OnchainKitAgentHandler({ 
  agentResponse, 
  onActionComplete 
}: OnchainKitAgentHandlerProps) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [componentConfig, setComponentConfig] = useState<any>(null);

  // Process the agent response when it changes
  useEffect(() => {
    if (agentResponse && agentResponse.data) {

      console.log('agentResponse', agentResponse);

      setActiveComponent(agentResponse.data.component);
      setComponentConfig(agentResponse.data.config || {});
      
      // If the action is not 'display', we might want to trigger some action
      if (agentResponse.data.action !== 'display' && onActionComplete) {
        // In a real implementation, you might want to wait for the action to complete
        // before calling onActionComplete
        setTimeout(() => {
          onActionComplete({
            success: true,
            component: agentResponse.data.component,
            action: agentResponse.data.action
          });
        }, 1000);
      }
    }
  }, [agentResponse, onActionComplete]);

  // Render the appropriate component based on the agent response
  const renderComponent = () => {
    if (!activeComponent) return null;

    switch (activeComponent) {
      case 'WalletDefault':
        return (
          <div className="onchain-component wallet-component">
            <h3>Connect Your Wallet</h3>
            <WalletDefault />
          </div>
        );
      
      case 'WalletDropdown':
        return (
          <div className="onchain-component wallet-component">
            <h3>Connect Your Wallet</h3>
            <WalletDropdown />
          </div>
        );
      
      case 'SwapDefault':
        const { from, to } = componentConfig;
        return (
          <div className="onchain-component swap-component">
            <h3>Swap Tokens</h3>
            <SwapDefault 
              from={from ? [from] : undefined}
              to={to ? [to] : undefined}
            />
          </div>
        );
      
      case 'Transaction':
        const { hash, chainId } = componentConfig;
        return (
          <div className="onchain-component transaction-component">
            <h3>Transaction Status</h3>
            {hash && (
              <Transaction 
                hash={hash}
                chainId={chainId}
              />
            )}
          </div>
        );
      
      case 'Identity':
        const { address } = componentConfig;
        return (
          <div className="onchain-component identity-component">
            <h3>Wallet Identity</h3>
            {address && (
              <Identity address={address}>
                <Avatar />
                <Name />
              </Identity>
            )}
          </div>
        );
      
      default:
        return (
          <div className="onchain-component unknown-component">
            <p>Unknown component: {activeComponent}</p>
          </div>
        );
    }
  };

  // If there's no agent response, don't render anything
  if (!agentResponse) return null;

  return (
    <div className="onchainkit-agent-handler">
      <div className="agent-message">
        <p>{agentResponse.message}</p>
      </div>
      {renderComponent()}
    </div>
  );
} 