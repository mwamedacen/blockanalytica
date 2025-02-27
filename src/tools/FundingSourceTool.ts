import { DuneClient, QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the schema for the tool's input
const FundingSourceSchema = z.object({
  wallet_address: z.string().describe("The wallet address to retrieve funding sources for"),
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
export const FundingSourceTool = tool(
  async ({ wallet_address }: z.infer<typeof FundingSourceSchema>) => {
    try {
      const duneClient = getDuneClient();
      const DUNE_QUERY_ID = 4777803; // As specified in the request
      
      // Prepare query parameters - only send wallet_address
      const queryParameters = [
        QueryParameter.text("wallet_address", wallet_address)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const queryTimerId = `FundingSourceTool-${wallet_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for funding source - wallet: ${wallet_address}, queryId: ${DUNE_QUERY_ID}`);
      console.time(queryTimerId);
      
      const response = await duneClient.getLatestResult(queryArgs);
      
      console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for funding source - wallet: ${wallet_address}, rows returned: ${response.result?.rows?.length || 0}`);

      // Return raw rows from response
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving funding sources:", error);
      return JSON.stringify({
        success: false,
        error: `Failed to retrieve funding sources: ${error.message}`
      });
    }
  },
  {
    name: "funding_source_retriever",
    description: "Retrieves the wallet that transferred native tokens to it the very first time. It returns at most one address.",
    schema: FundingSourceSchema,
  }
); 