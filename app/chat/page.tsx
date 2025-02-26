'use client';

import { useState, useRef, useEffect } from 'react';
import AgentStatus from '../components/AgentStatus';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentStatusData {
  activeAgents: string[];
  completedAgents: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    try {
      // Send to API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage
        }),
      });
      
      const data = await response.json();
      
      // Update agent status with data from response
      if (data.agentStatus) {
        setAgentStatus(data.agentStatus);
      }
      
      // Add assistant response to chat
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>BlockAnalytica Chat</h1>
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
              <p>Agent activity will appear here during processing</p>
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