import { QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runDuneQuery } from "../utils/DuneClient";

// Define the schema for the tool's input
const WalletSwapsRetrieverSchema = z.object({
  wallet_address: z.string().describe("The wallet address to retrieve swaps for"),
  start_date: z.string().describe("Start date in ISO 8601 but without T (e.g., 2023-01-01 00:00 and not 2023-01-01T00:00 )"),
  end_date: z.string().describe("End date in ISO 8601 but without T (e.g., 2023-12-31 01:00 and not 2023-12-31T01:00)"),
  limit: z.number().default(10).describe("Maximum number of swaps to retrieve")
});

// Create the tool using the functional approach
export const WalletSwapsRetrieverTool = tool(
  async ({ wallet_address, start_date, end_date, limit }: z.infer<typeof WalletSwapsRetrieverSchema>) => {
    try {
      // FIXME: hack to always query during same date ranges; UNDO AFTER OPTIM
      const start_date = '2024-12-01 00:00';
      const end_date = '2025-01-27 00:00';

      const DUNE_QUERY_ID = wallet_address.toLowerCase().startsWith('0x') ? 4789517 : 4777215; // Use EVM query for 0x addresses, Solana query otherwise
      
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
      
      const queryTimerId = `WalletSwapsRetrieverTool-${wallet_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for wallet swaps - wallet: ${wallet_address}, dates: ${start_date} to ${end_date}, limit: ${limit}, queryId: ${DUNE_QUERY_ID}`);
      console.time(queryTimerId);
      
      const response = await runDuneQuery(queryArgs);
      
      console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for wallet swaps - wallet: ${wallet_address}, rows returned: ${response.result?.rows?.length || 0}`);
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