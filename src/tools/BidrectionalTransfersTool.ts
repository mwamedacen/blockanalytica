import { DuneClient, QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the schema for the tool's input
const BidrectionalTransfersSchema = z.object({
  wallet_address: z.string().describe("The wallet address to retrieve bidirectional transfers for")
});

// Initialize Dune client
const getDuneClient = () => {
  const duneApiKey = process.env.DUNE_API_KEY;
  if (!duneApiKey) {
    throw new Error("DUNE_API_KEY environment variable is required");
  }
  return new DuneClient(duneApiKey);
};

// Create the tool using the functional approach
export const BidrectionalTransfersTool = tool(
  async ({ wallet_address }: z.infer<typeof BidrectionalTransfersSchema>) => {
    try {
      const duneClient = getDuneClient();
      const DUNE_QUERY_ID = 4777210; // As specified in the README
      
      // Prepare query parameters - only send wallet_address
      const queryParameters = [
        QueryParameter.text("wallet_address", wallet_address)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const queryTimerId = `BidrectionalTransfersTool-${wallet_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for bidirectional transfers - wallet: ${wallet_address}, queryId: ${DUNE_QUERY_ID}`);
      console.time(queryTimerId);
      
      const response = await duneClient.runQuery(queryArgs);
      
      console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for bidirectional transfers - wallet: ${wallet_address}, rows returned: ${response.result?.rows?.length || 0}`);

      // Just return the raw rows without post-processing
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving bidirectional transfers:", error);
      return JSON.stringify({
        success: false,
        error: `Failed to retrieve bidirectional transfers: ${error.message}`
      });
    }
  },
  {
    name: "bidirectional_transfers_retriever",
    description: "Retrieves wallets that have bidirectional transfer relationships with a target wallet",
    schema: BidrectionalTransfersSchema,
  }
); 