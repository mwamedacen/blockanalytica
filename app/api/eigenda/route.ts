import { EigenDAClient } from 'eigenda-sdk';
import { NextResponse } from 'next/server';
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  try {
    // Get job ID from path params
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Initialize the client
    const client = new EigenDAClient({
      privateKey: process.env.PK_EIGENDA
    });

    // Get status
    const status = await client.getStatus(jobId);

    if (status.status === 'CONFIRMED' || status.status === 'FINALIZED') {
      const data = await client.retrieve({ jobId });
      return NextResponse.json({ status, decodedBlobContent: JSON.parse(data.content) });
    }

    return NextResponse.json({ status });

  } catch (error) {
    console.error('Error getting EigenDA status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
