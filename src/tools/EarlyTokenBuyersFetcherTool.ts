import { QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runDuneQuery } from "../utils/DuneClient";

// Define the schema for the tool's input
const EarlyTokenBuyersFetcherSchema = z.object({
  token_address: z.string().describe("The token address to retrieve early buyers for"),
  limit: z.number().default(50).describe("Maximum number of early buyers to retrieve")
});

// Create the tool using the functional approach
export const EarlyTokenBuyersFetcherTool = tool(
  async ({ token_address, limit }: z.infer<typeof EarlyTokenBuyersFetcherSchema>) => {
    try {
      const DUNE_QUERY_ID = 4788297;
      
      // Prepare query parameters
      const queryParameters = [
        QueryParameter.text("token_address", token_address),
        QueryParameter.number("limit", limit)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const queryTimerId = `EarlyTokenBuyersFetcherTool-${token_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for early token buyers - token: ${token_address}, limit: ${limit}, queryId: ${DUNE_QUERY_ID}`);
      console.time(queryTimerId);
      
      const response = await runDuneQuery(queryArgs);
      
      console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for early token buyers - token: ${token_address}, rows returned: ${response.result?.rows?.length || 0}`);

      // Return raw rows from response
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving early token buyers:", error);
      return JSON.stringify({
        success: false,
        error: `Failed to retrieve early token buyers: ${error.message}`
      });
    }
  },
  {
    name: "early_token_buyers_fetcher",
    description: "Retrieves the first N buyers of a specific token, ordered by transaction time",
    schema: EarlyTokenBuyersFetcherSchema,
  }
); 