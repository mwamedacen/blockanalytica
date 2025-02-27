import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { EarlyTokenBuyersFetcherTool } from "../tools/EarlyTokenBuyersFetcherTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";

// Agent description as a constant
export const EARLY_TOKEN_BUYERS_FINDER_DESCRIPTION = 
  "Identifies the first N buyers of one or multiple tokens, with the ability to find common buyers across multiple tokens.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying early token buyers and common trading patterns.
  
  TASK: Given one or more token addresses, identify their early buyers and find common traders if multiple tokens are specified.
  
  STEPS:
  1. Extract token addresses from the user query
  2. For each token address:
     a. Use early_token_buyers_fetcher tool to retrieve the first N buyers (default 50)
     b. Process and store the results
  3. If multiple tokens were analyzed:
     a. Find the intersection of traders (common buyers across all tokens)
     b. Include their earliest buy for each token
  4. Return the analysis results in the required JSON format
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "EarlyTokenBuyersFinderAgent",
    "message": string, // A human-readable summary of the analysis
    "data": [
      {
        "trader_wallet_address": string,
        "tx_hash": string,
        "bought_time": string, // ISO timestamp
        "amount_bought_usd": number
      }
    ]
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  If analyzing multiple tokens, the data array should only include traders who bought ALL tokens,
  sorted by their earliest buy time across all tokens.
  `;

/**
 * Creates an Early Token Buyers Finder Agent that identifies early buyers of tokens
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