'use client';

import React, { useState } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';
import OnchainKitAgentHandler from '../components/OnchainKitAgentHandler';

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

export default function OnchainKitDemoPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState<OnchainKitAgentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Send to API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input
        }),
      });
      
      const data = await response.json();
      
      // Check for OnchainKit agent response
      let onchainKitAgentData = null;
      
      // First check if the response has aggregatedAgentsData
      if (data.response && 
          typeof data.response === 'object' && 
          data.response.aggregatedAgentsData && 
          Array.isArray(data.response.aggregatedAgentsData)) {
        
        // Find the OnchainKitAgent response in the aggregatedAgentsData array
        onchainKitAgentData = data.response.aggregatedAgentsData.find(
          (agent: any) => agent.agentName === 'OnchainKitAgent'
        );
      }
      
      // If not found in aggregatedAgentsData, check if the response itself is from OnchainKitAgent
      if (!onchainKitAgentData && 
          data.response && 
          typeof data.response === 'object' && 
          data.response.agentName === 'OnchainKitAgent') {
        onchainKitAgentData = data.response;
      }
      
      // If we found an OnchainKit agent response, use it
      if (onchainKitAgentData) {
        setAgentResponse(onchainKitAgentData);
      } else {
        setErrorMessage('The response was not from the OnchainKitAgent. Try a query related to wallet connection, token swaps, or transactions.');
        setAgentResponse(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('An error occurred while processing your request.');
      setAgentResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionComplete = (result: any) => {
    console.log('OnchainKit action completed:', result);
  };

  return (
    <OnchainKitProvider
      config={{
        appearance: {
          name: 'OnchainKit Demo',
          logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
          mode: 'auto',
          theme: 'default',
        },
      }}
      chain={base}
    >
      <div className="onchainkit-demo-container">
        <div className="demo-header">
          <h1>OnchainKit Agent Demo</h1>
          <p>Ask the agent to help you with wallet connection, token swaps, or transactions</p>
        </div>
        
        <div className="demo-content">
          <div className="demo-form">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 'I want to connect my wallet' or 'Help me swap ETH to USDC'"
                className="demo-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="demo-button"
              >
                {isLoading ? 'Processing...' : 'Send'}
              </button>
            </form>
          </div>
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          <div className="agent-response-container">
            {agentResponse ? (
              <OnchainKitAgentHandler
                agentResponse={agentResponse}
                onActionComplete={handleActionComplete}
              />
            ) : (
              <div className="empty-response">
                <p>Your OnchainKit component will appear here</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="demo-examples">
          <h2>Example Queries</h2>
          <ul>
            <li onClick={() => setInput('I want to connect my wallet')}>
              "I want to connect my wallet"
            </li>
            <li onClick={() => setInput('Help me swap ETH to USDC')}>
              "Help me swap ETH to USDC"
            </li>
            <li onClick={() => setInput('I need to check a transaction status')}>
              "I need to check a transaction status"
            </li>
            <li onClick={() => setInput('Show me my wallet identity')}>
              "Show me my wallet identity"
            </li>
          </ul>
        </div>
      </div>
    </OnchainKitProvider>
  );
} 