import { DuneClient, QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the schema for the tool's input
const WalletSwapsRetrieverSchema = z.object({
  wallet_address: z.string().describe("The wallet address to retrieve swaps for"),
  start_date: z.string().describe("Start date in ISO 8601 but without T (e.g., 2023-01-01 00:00 and not 2023-01-01T00:00 )"),
  end_date: z.string().describe("End date in ISO 8601 but without T (e.g., 2023-12-31 01:00 and not 2023-12-31T01:00)"),
  limit: z.number().default(10).describe("Maximum number of swaps to retrieve")
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
export const WalletSwapsRetrieverTool = tool(
  async ({ wallet_address, start_date, end_date, limit }: z.infer<typeof WalletSwapsRetrieverSchema>) => {
    try {
      const duneClient = getDuneClient();
      const DUNE_QUERY_ID = 4772832; // As specified in the README
      
      // Prepare query parameters
      const queryParameters = [
        QueryParameter.text("wallet_address", wallet_address),
        QueryParameter.date("start_date", start_date),
        QueryParameter.date("end_date", end_date),
        QueryParameter.number("limit", limit)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const response = await duneClient.runQuery(queryArgs);

      // Return raw rows from response
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving wallet swaps:", error);
      throw new Error(`Failed to retrieve wallet swaps: ${error.message}`);
    }
  },
  {
    name: "wallet_swaps_retriever",
    description: "Retrieves swap activity for a specific wallet address within a date range",
    schema: WalletSwapsRetrieverSchema,
  }
); 