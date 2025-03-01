import { NextRequest, NextResponse } from 'next/server';
import { SupervisorAgent } from '../../../src/SupervisorAgent';
import { getMiniChatAPI } from '../../../src/llms/ChatAPI';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize the supervisor agent
let supervisorAgent: SupervisorAgent | null = null;

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const privyClient = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

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

    const headerAuthToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
    const cookieAuthToken = request.cookies.get("privy-token")?.value;
  
    let claims = null;
    try {
      
      const authToken = cookieAuthToken || headerAuthToken;
      claims = authToken? await privyClient.verifyAuthToken(authToken): null;
    } catch (e: any) {
      console.log(e);
    }
    
    // Track active agents
    const activeAgents: string[] = [];
    const completedAgents: string[] = [];
    
    // Check if the message is related to OnchainKit
    const isOnchainKitRequest = /wallet|swap|transaction|connect|token|frame/i.test(message);
    
    // Process the query through supervisor agent
    console.log(`[${new Date().toISOString()}] Processing query through supervisor agent:`, message);
    const queryTimerId = `supervisor-query-${Date.now()}`;
    console.time(queryTimerId);
    
    const response = claims ? await supervisorAgent.processQueryWithUser(message, claims): await supervisorAgent.processQuery(message);
    
    console.timeEnd(queryTimerId);
    console.log(`[${new Date().toISOString()}] Completed processing query, response:`, response);
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