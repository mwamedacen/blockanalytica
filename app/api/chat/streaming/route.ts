import { NextRequest } from 'next/server';
import { SupervisorAgentStreaming } from '../../../../src/SupervisorAgentStreaming';

// Initialize the supervisor agent
let supervisorAgent: SupervisorAgentStreaming | null = null;

// Process a streaming request
export async function POST(request: NextRequest) {
  try {
    // Lazy initialize the supervisor agent
    if (!supervisorAgent) {
      supervisorAgent = new SupervisorAgentStreaming();
    }
    
    const { message } = await request.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create a transform stream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the query in the background
    (async () => {
      try {
        // Get the streaming response from the supervisor
        for await (const chunk of supervisorAgent!.processQueryStream(message)) {
          // Write each chunk to the stream
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        }
      } catch (error) {
        console.error('Error in stream processing:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'An error occurred during processing'
          })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    // Return the stream to the client
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}