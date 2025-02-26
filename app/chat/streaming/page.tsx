'use client';

import { useState, useRef, useEffect } from 'react';
import AgentStatus from '../../components/AgentStatus';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentStatusData {
  activeAgents: string[];
  completedAgents: string[];
}

export default function StreamingChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Reset agent status for new query
    setAgentStatus(null);
    
    // Close any existing event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      // First make the initial request to start processing
      const response = await fetch('/api/chat/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage
        }),
      });
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      // Set up event source for streaming responses
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process any complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                
                if (data.type === 'status') {
                  // Update agent status
                  setAgentStatus(data.agentStatus);
                } else if (data.type === 'result') {
                  // Final result
                  setAgentStatus(data.agentStatus);
                  setMessages((prev) => [...prev, { 
                    role: 'assistant', 
                    content: data.response 
                  }]);
                  setIsLoading(false);
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: 'Sorry, there was an error processing your request.' 
          }]);
          setIsLoading(false);
        }
      };
      
      processStream();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Real-time Agent Status</h1>
      </div>
      
      <div className="chat-columns">
        {/* Left Column: Messages */}
        <div className="chat-messages-column">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>
                  Start a conversation with BlockAnalytica...
                </p>
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
                  </div>
                ))}
                {isLoading && (
                  <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
        
        {/* Right Column: Agent Status */}
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
              <p>Agent activity will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
  );
}