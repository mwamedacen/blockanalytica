import { QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runDuneQuery } from "../utils/DuneClient";

// Define the schema for the tool's input
const HistoricalEnsDomainsFetcherSchema = z.object({
  wallet_address: z.string().describe("The wallet address to retrieve historical ENS domains for")
});

// Create the tool using the functional approach
export const HistoricalEnsDomainsFetcherTool = tool(
  async ({ wallet_address }: z.infer<typeof HistoricalEnsDomainsFetcherSchema>) => {
    try {
      const DUNE_QUERY_ID = 4783251;
      
      // Prepare query parameters - only send wallet_address
      const queryParameters = [
        QueryParameter.text("wallet_address", wallet_address)
      ];
      
      // Execute the Dune query
      const queryArgs: RunQueryArgs = {
        queryId: DUNE_QUERY_ID,
        query_parameters: queryParameters
      };
      
      const queryTimerId = `HistoricalEnsDomainsFetcherTool-${wallet_address}-${Date.now()}`;
      console.log(`[${new Date().toISOString()}] Starting Dune query for historical ENS domains - wallet: ${wallet_address}, queryId: ${DUNE_QUERY_ID}`);
      // console.time(queryTimerId);
      
      const response = await runDuneQuery(queryArgs);
      
      // console.timeEnd(queryTimerId);
      console.log(`[${new Date().toISOString()}] Completed Dune query for historical ENS domains - wallet: ${wallet_address}, rows returned: ${response.result?.rows?.length || 0}`);

      // Return raw rows from response
      return JSON.stringify(response.result?.rows || []);
    } catch (error: any) {
      console.error("Error retrieving historical ENS domains:", error);
      return JSON.stringify({
        success: false,
        error: `Failed to retrieve historical ENS domains: ${error.message}`
      });
    }
  },
  {
    name: "historical_ens_domains_fetcher",
    description: "Retrieves all historical ENS domains associated with a given wallet address",
    schema: HistoricalEnsDomainsFetcherSchema,
  }
); 