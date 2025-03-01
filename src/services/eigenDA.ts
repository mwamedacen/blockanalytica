import { EigenDAClient } from 'eigenda-sdk';

export class EigenDAService {
  private client: EigenDAClient;
  private identifier: Uint8Array;

  constructor() {
    if (!process.env.PK_EIGENDA) {
      throw new Error('EigenDA private key not found in environment variables');
    }

    this.client = new EigenDAClient({
      privateKey: process.env.PK_EIGENDA
    });

    // Fixed identifier for this service
    this.identifier = new Uint8Array(
      Array(31).fill(0).concat([9])  // [0,0,...,0,9]
    );
  }

  async uploadData(data: any): Promise<string> {
    const stringifiedData = JSON.stringify(data);
    const uploadResult = await this.client.upload(stringifiedData, this.identifier) as unknown as { job_id: string };
    return uploadResult.job_id;
  }

  async waitForConfirmation(jobId: string): Promise<void> {
    await this.client.waitForStatus(jobId, 'CONFIRMED');
  }

  async retrieveData(jobId: string): Promise<any> {
    return await this.client.retrieve({ jobId });
  }
}

// Export singleton instance
export const eigenDA = new EigenDAService(); 