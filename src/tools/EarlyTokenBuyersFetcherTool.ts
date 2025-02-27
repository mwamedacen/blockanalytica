import { QueryParameter, RunQueryArgs } from "@duneanalytics/client-sdk";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runDuneQuery } from "../utils/DuneClient";

// Define the schema for token input
const TokenInputSchema = z.object({
  token_address: z.string().describe("Token address to retrieve early buyers for"),
  limit: z.number().describe("Maximum number of early buyers to retrieve for this token")
});

// Define the schema for the tool's input
const EarlyTokenBuyersFetcherSchema = z.object({
  tokens: z.array(TokenInputSchema).describe("Array of token addresses and their individual limits")
});

// Create the tool using the functional approach
export const EarlyTokenBuyersFetcherTool = tool(
  async ({ tokens }: z.infer<typeof EarlyTokenBuyersFetcherSchema>) => {
    try {
      console.log("EarlyTokenBuyersFetcherTool", tokens);
      const DUNE_QUERY_ID = 4788297;
      
      // Execute queries in parallel for all tokens
      const queryPromises = tokens.map(async ({ token_address, limit }) => {
        // Prepare query parameters for this token
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

        return {
          token_address,
          buyers: response.result?.rows || []
        };
      });

      // Wait for all queries to complete
      const results = await Promise.all(queryPromises);

      // First find common buyers across all tokens
      const buyerSets = results.map(({ buyers }) => 
        new Set(buyers.map((buyer: any) => buyer.trader_wallet_address))
      );

      // Start with the first set and find intersection with all others
      const commonBuyerAddresses = buyerSets.length > 0 
        ? buyerSets.reduce((intersection, currentSet) => 
            new Set([...intersection].filter(x => currentSet.has(x))), 
            buyerSets[0]
          )
        : new Set();

      console.log(">>>>>>commonBuyerAddresses", commonBuyerAddresses);

      // For each common buyer, collect their transaction details across all tokens
      const commonBuyersData = Array.from(commonBuyerAddresses).map(address => {
        const transactions = results.flatMap(({ token_address, buyers }) => {
          const buyerData = buyers.find((b: any) => b.trader_wallet_address === address);
          if (!buyerData) return [];
          return [{
            token_address,
            tx_hash: buyerData.tx_hash,
            bought_time: buyerData.bought_time,
            amount_bought_usd: buyerData.amount_bought_usd
          }];
        });

        return {
          trader_wallet_address: address,
          transactions
        };
      });

      return JSON.stringify(commonBuyersData);
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
    description: "Retrieves early buyers for multiple tokens with customizable limits per token and finds common buyers across all tokens",
    schema: EarlyTokenBuyersFetcherSchema,
  }
); 