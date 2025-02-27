import { NextRequest, NextResponse } from 'next/server';
import { SupervisorAgent } from '../../../src/SupervisorAgent';
import { getMiniChatAPI } from '../../../src/llms/ChatAPI.ts';
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
    
    // Process the query through supervisor agent
    // Note: This is a mock implementation - you'll need to modify SupervisorAgent.ts
    // to actually track agent status and return it
    const response = await supervisorAgent.processQuery(message);

    const miniChat = getMiniChatAPI()

    const formattedResponse = await miniChat.invoke([
      new SystemMessage("you are a helpful assistant that formats json responses into a human readable format (string). The data is about blockchain so you want to include links to explorers like etherscan or solscan"),
      new HumanMessage(JSON.stringify(response)),
    ]);
    // Mock some agents that would be running
    // In a real implementation, the SupervisorAgent would provide this information
    completedAgents.push(
      "ENSWalletIdentifierAgent", 
      "CopyTraderDetectorAgent", 
      "SideWalletsFinderAgent"
    );
    
    return NextResponse.json({ 
      response: formattedResponse.content,
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