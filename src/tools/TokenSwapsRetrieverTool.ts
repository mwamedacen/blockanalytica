import { QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SwapSide } from "../types";
import { runDuneQuery } from "../utils/DuneClient";

// Define the schema for the tool's input
const TokenSwapsRetrieverSchema = z.object({
  token_address: z.string().describe("The token address to retrieve swaps for"),
  side: z.nativeEnum(SwapSide).describe("Filter by BUY or SELL side"),
  start_date: z.string().describe("Start date in ISO 8601 but without 'T' (e.g., 2023-01-01 00:00 but not 2023-01-01T00:00)"),
  end_date: z.string().describe("End date in ISO 8601 but without 'T' (e.g., 2023-12-31 12:00 but not 2023-12-31T12:00)"),
  limit: z.number().default(50).describe("Maximum number of swaps to retrieve")
});

// Create the tool using the functional approach
export const TokenSwapsRetrieverTool = tool(
  async ({ token_address, side, start_date, end_date, limit }: z.infer<typeof TokenSwapsRetrieverSchema>) => {
    try {
      const DUNE_QUERY_ID = token_address.toLowerCase().startsWith('0x') ? 4789506 : 4777218; // Use EVM query for 0x addresses, Solana query otherwise
      
      // Prepare query parameters
      const queryParameters = [
        QueryParameter.text("token_address", token_address),
        QueryParameter.text("side", String(side)),
        QueryParameter.date("start_date", start_date),
        QueryParameter.date("end_date", end_date),
        QueryParameter.number("limit", limit)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const queryTimerId = `TokenSwapsRetrieverTool-${token_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for token swaps - token: ${token_address}, queryId: ${DUNE_QUERY_ID}`);
      // console.time(queryTimerId);
      
      const response = await runDuneQuery(queryArgs);
      
      // console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for token swaps - token: ${token_address}, rows returned: ${response.result?.rows?.length || 0}`);

      // Return raw rows from response
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving token swaps:", error);
      throw new Error(`Failed to retrieve token swaps: ${error.message}`);
    }
  },
  {
    name: "token_swaps_retriever",
    description: "Retrieves swap activity for a specific token address within a date range",
    schema: TokenSwapsRetrieverSchema,
  }
); 