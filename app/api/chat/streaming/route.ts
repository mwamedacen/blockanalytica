import { NextRequest } from 'next/server';

// Process a streaming request
export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  if (!message) {
    return new Response(
      JSON.stringify({ error: 'Message is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Create a text encoder
  const encoder = new TextEncoder();
  
  // Create a transform stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start processing in the background
  processStreamingRequest(message, writer);
  
  // Return the stream to the client
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function processStreamingRequest(message: string, writer: WritableStreamDefaultWriter) {
  try {
    const encoder = new TextEncoder();
    
    // Initial state
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      agentStatus: {
        activeAgents: ['SupervisorAgent'],
        completedAgents: []
      }
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Supervisor activates agents
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      agentStatus: {
        activeAgents: ['ENSWalletIdentifierAgent', 'CopyTraderDetectorAgent', 'SideWalletsFinderAgent'],
        completedAgents: ['SupervisorAgent']
      }
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ENS agent completes
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      agentStatus: {
        activeAgents: ['CopyTraderDetectorAgent', 'SideWalletsFinderAgent'],
        completedAgents: ['SupervisorAgent', 'ENSWalletIdentifierAgent']
      }
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // CopyTrader agent completes
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      agentStatus: {
        activeAgents: ['SideWalletsFinderAgent'],
        completedAgents: ['SupervisorAgent', 'ENSWalletIdentifierAgent', 'CopyTraderDetectorAgent']
      }
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // SideWallets agent completes
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      agentStatus: {
        activeAgents: [],
        completedAgents: ['SupervisorAgent', 'ENSWalletIdentifierAgent', 'CopyTraderDetectorAgent', 'SideWalletsFinderAgent']
      }
    })}\n\n`));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Final result
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'result',
      response: `Analysis completed for: "${message}". Found 3 related wallets and detected possible copy trading activity.`,
      agentStatus: {
        activeAgents: [],
        completedAgents: ['SupervisorAgent', 'ENSWalletIdentifierAgent', 'CopyTraderDetectorAgent', 'SideWalletsFinderAgent']
      }
    })}\n\n`));
    
    // End the stream
    await writer.close();
  } catch (error) {
    console.error("Error processing streaming request:", error);
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      error: 'An error occurred during processing'
    })}\n\n`));
    await writer.close();
  }
}