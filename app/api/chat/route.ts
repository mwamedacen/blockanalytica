import { NextRequest, NextResponse } from 'next/server';
import { SupervisorAgent } from '../../../src/SupervisorAgent';

// Initialize the supervisor agent
let supervisorAgent: SupervisorAgent | null = null;

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
    
    // Process the query through supervisor agent
    const response = await supervisorAgent.processQuery(message);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}