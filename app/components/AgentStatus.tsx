'use client';

import { useState, useEffect } from 'react';

interface AgentStatusProps {
  activeAgents: string[];
  completedAgents: string[];
}

// Agent descriptions for tooltip or additional info
const agentDescriptions: Record<string, string> = {
  "SupervisorAgent": "Coordinates all analysis tasks and synthesizes results",
  "ENSWalletIdentifierAgent": "Resolves ENS domains to wallet addresses",
  "CopyTraderDetectorAgent": "Analyzes potential copy trading behavior",
  "SideWalletsFinderAgent": "Discovers related wallet addresses"
};

export default function AgentStatus({ activeAgents, completedAgents }: AgentStatusProps) {
  // Mock timers to simulate agent completion if there are any active agents
  // In a real app, this would be updated by server-sent events or polling
  const [localActiveAgents, setLocalActiveAgents] = useState<string[]>(activeAgents);
  const [localCompletedAgents, setLocalCompletedAgents] = useState<string[]>(completedAgents);
  
  useEffect(() => {
    setLocalActiveAgents(activeAgents);
    setLocalCompletedAgents(completedAgents);
  }, [activeAgents, completedAgents]);
  
  useEffect(() => {
    if (localActiveAgents.length === 0) return;
    
    // Simulate agents completing their work over time
    const timeouts = localActiveAgents.map((agent, index) => {
      return setTimeout(() => {
        setLocalActiveAgents(prev => prev.filter(a => a !== agent));
        setLocalCompletedAgents(prev => [...prev, agent]);
      }, (index + 1) * 3000); // Complete one agent every 3 seconds
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  if (localActiveAgents.length === 0 && localCompletedAgents.length === 0) {
    return null;
  }

  return (
    <div className="agent-status">
      {localActiveAgents.length > 0 && (
        <div className="agent-group">
          <h4>Active Agents</h4>
          <ul className="agent-list">
            {localActiveAgents.map((agent, index) => (
              <li key={index} className="agent-item active" title={agentDescriptions[agent] || agent}>
                <span className="agent-name">{agent}</span>
                <span className="agent-indicator"></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {localCompletedAgents.length > 0 && (
        <div className="agent-group">
          <h4>Completed</h4>
          <ul className="agent-list">
            {localCompletedAgents.map((agent, index) => (
              <li key={index} className="agent-item completed" title={agentDescriptions[agent] || agent}>
                <span className="agent-name">{agent}</span>
                <span className="agent-indicator">✓</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}