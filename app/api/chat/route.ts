import { NextRequest, NextResponse } from 'next/server';
import { SupervisorAgent } from '../../../src/SupervisorAgent';
import { getMiniChatAPI } from '../../../src/llms/ChatAPI';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Initialize the supervisor agent
let supervisorAgent: SupervisorAgent | null = null;

// Keep track of agents for UI display
interface AgentStatus {
  activeAgents: string[];
  completedAgents: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Lazy initialize the supervisor agent
    if (!supervisorAgent) {
      supervisorAgent = new SupervisorAgent();
      // await supervisorAgent.initialize();
    }
    
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Track active agents
    const activeAgents: string[] = [];
    const completedAgents: string[] = [];
    
    // Check if the message is related to OnchainKit
    const isOnchainKitRequest = /wallet|swap|transaction|connect|token|frame/i.test(message);
    
    // Process the query through supervisor agent
    const response = await supervisorAgent.processQuery(message);
    
    // Check if the response is from the OnchainKitAgent
    let isOnchainKitResponse = false;
    
    // Check if the response has aggregatedAgentsData
    if (response && 
        typeof response === 'object' && 
        response.aggregatedAgentsData && 
        Array.isArray(response.aggregatedAgentsData)) {
      
      // Check if any agent in aggregatedAgentsData is OnchainKitAgent
      isOnchainKitResponse = response.aggregatedAgentsData.some(
        (agent: any) => agent.agentName === 'OnchainKitAgent'
      );
    } else if (response && 
               typeof response === 'object' && 
               'agentName' in response && 
               response.agentName === 'OnchainKitAgent') {
      isOnchainKitResponse = true;
    }
    
    // If it's an OnchainKit response, add the OnchainKitAgent to completed agents
    if (isOnchainKitResponse) {
      completedAgents.push("OnchainKitAgent");
    } else {
      // Otherwise, add the other agents to completed agents
      completedAgents.push(
        "ENSWalletIdentifierAgent", 
        "CopyTraderDetectorAgent", 
        "SideWalletsFinderAgent"
      );
    }
    
    return NextResponse.json({ 
      response,
      agentStatus: {
        activeAgents: [],
        completedAgents
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}