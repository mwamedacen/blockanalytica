'use client';

import '@coinbase/onchainkit/styles.css';
import '../styles/chat.css';
import { useState, useRef, useEffect } from 'react';
import AgentStatus from '../components/AgentStatus';
import { Providers } from '../components/provider';
import OnchainKitAgentHandler from '../components/OnchainKitAgentHandler';

import { base } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WalletDefault } from '@coinbase/onchainkit/wallet';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentStatusData {
  activeAgents: string[];
  completedAgents: string[];
}

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

// Define stream response types
interface StreamContentResponse {
  type: 'content';
  content: string;
}

interface StreamErrorResponse {
  type: 'error';
  error: string;
}

type StreamResponse = StreamContentResponse | StreamErrorResponse;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [agentStatus, setAgentStatus] = useState<AgentStatusData>({
    activeAgents: [],
    completedAgents: []
  });
  const [showSwap, setShowSwap] = useState(false);
  const [onchainKitResponse, setOnchainKitResponse] = useState<OnchainKitAgentResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  // Suggestions data
  const suggestions = [
    {
      title: "Find Early Token Buyers",
      query: "Find wallets that were among first 200 to buy $AIXBT and $VIRTUAL"
    },
    {
      title: "Check ENS History",
      query: "What ENS domains have been purchased by vitalik.eth?"
    },
    {
      title: "Find Related Wallets",
      query: "Find side wallets of vitalik.eth"
    },
    {
      title: "Detect Copy Trading",
      query: "Who is copy trading frank degods ? his address is CRVidEDtEUTYZisCxBZkpELzhQc9eauMLR3FWg74tReL btw"
    },
    {
      title: "Swap Tokens",
      query: "I want to swap kaito to usdc on Base"
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Processes a single SSE message from the stream
   */
  const processStreamMessage = (data: StreamResponse) => {
    switch (data.type) {
      case 'content':
        // Add to or update the streaming message
        setCurrentStreamingMessage(prev => prev + data.content);

        // Check for OnchainKit response
        try {
          const fullMessage = currentStreamingMessage + data.content;
          let jsonResponse = null;
          if (fullMessage.includes("```json")) {
            jsonResponse = JSON.parse(fullMessage.replaceAll("```json", "").replaceAll("```", ""));
          }

          // Check for OnchainKit agent response
          if (jsonResponse && 
              typeof jsonResponse === 'object' && 
              jsonResponse.aggregatedAgentsData && 
              Array.isArray(jsonResponse.aggregatedAgentsData)) {
            
            const onchainKitAgentData = jsonResponse.aggregatedAgentsData.find(
              (agent: any) => agent.agentName === 'OnchainKitAgent'
            );

            if (onchainKitAgentData) {
              setOnchainKitResponse(onchainKitAgentData);
            }
          }
        } catch (error) {
          console.error('Error parsing OnchainKit response:', error);
        }
        break;

      case 'error':
        // Handle error response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}` 
        }]);
        setCurrentStreamingMessage('');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setShowSuggestions(false);
    
    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Reset agent status for new query
    setAgentStatus({
      activeAgents: [],
      completedAgents: []
    });
    setOnchainKitResponse(null);
    
    try {
      // Send to streaming API endpoint
      const response = await fetch('/api/chat/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Create a reader for the response stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the chunk and add it to the buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(5)) as StreamResponse; // Remove 'data: ' prefix
            processStreamMessage(data);
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
      setAgentStatus({
        activeAgents: [],
        completedAgents: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnchainKitActionComplete = (result: any) => {
    console.log('OnchainKit action completed:', result);
    // You can add additional logic here if needed
  };

  // Add this new function to handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef?.focus();
  };

  const renderSuggestions = () => (
    <div className="agent-capabilities-chat">
      <h3>Example Queries</h3>
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button 
              className="suggestion-button" 
              onClick={() => handleSuggestionClick(suggestion.query)}
            >
              <strong>{suggestion.title}</strong> - "{suggestion.query}"
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'ntBs8y178W5eiLMELXUkO-2A3QDMat-7'} 
      config={{
        appearance: {
          name: 'OnchainKit Playground',
          logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
          mode: 'auto',
          theme: 'default',
        },
      }}
      chain={base}
    >
    
    <div className="chat-container">
      <div className="chat-header">
        <h1>BlockAnalytica Chat</h1> 
        <div className="header-right">
          <WalletDefault />
        </div>
      </div>
      
      <div className="chat-columns">
        {/* Left Column: Messages */}
        <div className="chat-messages-column">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <h2>Welcome to BlockAnalytica Chat</h2>
                <p>I'm your blockchain forensics assistant, powered by specialized AI agents.</p>
                
                {showSuggestions && renderSuggestions()}
                
                <p className="start-prompt">Type your question below to begin...</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      message.role === 'user' 
                        ? 'user-message' 
                        : 'assistant-message'
                    }`}
                  >
                    {message.content}
                    {message.role === 'user' && message.content.toLowerCase().includes('swap') && !showSwap && (
                      <div className="swap-suggestion">
                        <button 
                          onClick={() => setShowSwap(true)}
                          className="swap-suggestion-button"
                        >
                          Open Swap Interface
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Show streaming message if there is one */}
                {currentStreamingMessage && (
                  <div className="chat-message assistant-message">
                    {currentStreamingMessage}
                  </div>
                )}
                {isLoading && !currentStreamingMessage && (
                  <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                
                {/* Show suggestions panel after messages if enabled */}
                {showSuggestions && messages.length > 0 && (
                  <div className="suggestions-panel">
                    {renderSuggestions()}
                  </div>
                )}

                {/* Floating suggestions toggle button */}
                <button 
                  className="floating-suggestions-toggle"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                >
                  {showSuggestions ? '❌' : '💡'}
                </button>
              </>
            )}
          </div>
          
          {/* Chat Input Form */}
          <form onSubmit={handleSubmit} className="chat-input-form">
            <div className="input-container">
              <input
                ref={setInputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      handleSubmit(e);
                    }
                  }
                }}
                placeholder="Ask a question about blockchain data..."
                className="input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn btn-primary"
              >
                Send
              </button>
            </div>
          </form>
        </div>
        
        {/* Right Column: Agent Status and OnchainKit Components */}
        <div className="agent-status-column">
          <h2>Agent Activity</h2>
          {isLoading && !agentStatus && (
            <AgentStatus 
              activeAgents={['SupervisorAgent']} 
              completedAgents={[]} 
            />
          )}
          
          {agentStatus && (
            <AgentStatus 
              activeAgents={agentStatus.activeAgents} 
              completedAgents={agentStatus.completedAgents} 
            />
          )}
          
          {!isLoading && !agentStatus && messages.length === 0 && (
            <div className="empty-agent-status">
              <p>Agent activity will appear here during processing</p>
            </div>
          )}
          
          {/* OnchainKit Agent Handler */}
          {onchainKitResponse && (
            <div className="onchainkit-container">
              <OnchainKitAgentHandler 
                agentResponse={onchainKitResponse}
                onActionComplete={handleOnchainKitActionComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </OnchainKitProvider>
  );
}