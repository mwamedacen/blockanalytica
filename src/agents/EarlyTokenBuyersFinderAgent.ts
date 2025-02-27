import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { EarlyTokenBuyersFetcherTool } from "../tools/EarlyTokenBuyersFetcherTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";

// Agent description as a constant
export const EARLY_TOKEN_BUYERS_FINDER_DESCRIPTION = 
  "Identifies common early buyers across multiple tokens by analyzing the intersection of their first N buyers, with customizable limits per token.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying early token buyers and common trading patterns.
  
  TASK: Given multiple token addresses and their individual limits (optional), identify traders who were early buyers of ALL the specified tokens.
  
  STEPS:
  1. Extract token addresses and their desired limits from the user query (limits are optional)
  2. Format the input as an array of objects: { token_address: string, limit?: number }[]
  3. Use early_token_buyers_fetcher tool exactly once with the formatted input and it should return the common buyers with extra data
  4. Return the analysis results in the required JSON format
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "EarlyTokenBuyersFinderAgent",
    "message": string, // A human-readable summary of the analysis
    "data": [
      {
        "trader_wallet_address": string,
        "transactions": [
          {
            "token_address": string,
            "tx_hash": string,
            "bought_time": string, // ISO timestamp
            "amount_bought_usd": number
          }
        ]
      }
    ]
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  The data array should be sorted by the earliest buy time across all tokens for each trader.
  Include a clear message summarizing:
  1. How many tokens were analyzed (with their individual limits)
  2. How many common early buyers were found
  3. The total USD value of early purchases by these common buyers
  
  EXAMPLE QUERY FORMATS:
  1. "Find common buyers between token 0x123 (first 100) and 0x456 (first 50)"
  2. "Who bought all these tokens early: 0x123 (top 30), 0x456 (top 50), 0x789 (top 20)"
  `;

/**
 * Creates an Early Token Buyers Finder Agent that identifies common early buyers across multiple tokens
 * @returns The configured agent instance
 */
export function createEarlyTokenBuyersFinderAgent() {
  // Initialize LLM using the shared API
  const llm = getChatAPI();
  
  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the early token buyers fetcher tool
  return createReactAgent({
    name: 'EarlyTokenBuyersFinderAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [EarlyTokenBuyersFetcherTool],
    checkpointSaver: agentCheckpointer,
  });
} 