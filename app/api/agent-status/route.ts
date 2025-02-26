import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for agent status (this would be replaced by a proper database in production)
interface RequestState {
  id: string;
  activeAgents: string[];
  completedAgents: string[];
  lastUpdated: number;
  isPending: boolean;
  result?: string;
}

const requestStore = new Map<string, RequestState>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestId = searchParams.get('requestId');
  
  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }
  
  const requestState = requestStore.get(requestId);
  
  if (!requestState) {
    return NextResponse.json(
      { error: 'Request not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    id: requestState.id,
    activeAgents: requestState.activeAgents,
    completedAgents: requestState.completedAgents,
    isPending: requestState.isPending,
    result: requestState.result
  });
}

// For testing - we'll simulate some agent processing
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique request ID
    const requestId = Date.now().toString();
    
    // Initialize request state
    requestStore.set(requestId, {
      id: requestId,
      activeAgents: ['SupervisorAgent'],
      completedAgents: [],
      lastUpdated: Date.now(),
      isPending: true
    });
    
    // Start background processing simulation
    simulateAgentProcessing(requestId, message);
    
    return NextResponse.json({ 
      requestId,
      message: 'Processing started'
    });
  } catch (error) {
    console.error('Error starting processing:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}

// Simulation of agent processing
async function simulateAgentProcessing(requestId: string, message: string) {
  // First update - supervisor delegates to agents
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const state = requestStore.get(requestId);
  if (!state) return;
  
  // Supervisor starts agents
  requestStore.set(requestId, {
    ...state,
    activeAgents: ['ENSWalletIdentifierAgent', 'CopyTraderDetectorAgent', 'SideWalletsFinderAgent'],
    completedAgents: ['SupervisorAgent'],
    lastUpdated: Date.now()
  });
  
  // ENS agent completes
  await new Promise(resolve => setTimeout(resolve, 2000));
  const state2 = requestStore.get(requestId);
  if (!state2) return;
  
  requestStore.set(requestId, {
    ...state2,
    activeAgents: state2.activeAgents.filter(a => a !== 'ENSWalletIdentifierAgent'),
    completedAgents: [...state2.completedAgents, 'ENSWalletIdentifierAgent'],
    lastUpdated: Date.now()
  });
  
  // CopyTrader agent completes
  await new Promise(resolve => setTimeout(resolve, 3000));
  const state3 = requestStore.get(requestId);
  if (!state3) return;
  
  requestStore.set(requestId, {
    ...state3,
    activeAgents: state3.activeAgents.filter(a => a !== 'CopyTraderDetectorAgent'),
    completedAgents: [...state3.completedAgents, 'CopyTraderDetectorAgent'],
    lastUpdated: Date.now()
  });
  
  // SideWallets agent completes
  await new Promise(resolve => setTimeout(resolve, 2000));
  const state4 = requestStore.get(requestId);
  if (!state4) return;
  
  requestStore.set(requestId, {
    ...state4,
    activeAgents: state4.activeAgents.filter(a => a !== 'SideWalletsFinderAgent'),
    completedAgents: [...state4.completedAgents, 'SideWalletsFinderAgent'],
    lastUpdated: Date.now()
  });
  
  // All done - set the final result
  await new Promise(resolve => setTimeout(resolve, 1000));
  const finalState = requestStore.get(requestId);
  if (!finalState) return;
  
  requestStore.set(requestId, {
    ...finalState,
    isPending: false,
    result: `Analysis completed for: "${message}". Found 3 related wallets and detected possible copy trading activity.`,
    lastUpdated: Date.now()
  });
  
  // Clean up after 5 minutes
  setTimeout(() => {
    requestStore.delete(requestId);
  }, 5 * 60 * 1000);
}