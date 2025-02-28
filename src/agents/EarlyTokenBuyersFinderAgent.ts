import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { EarlyTokenBuyersFetcherTool } from "../tools/EarlyTokenBuyersFetcherTool";
import { getChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const EARLY_TOKEN_BUYERS_FINDER_DESCRIPTION = 
  "Identifies common early buyers across multiple tokens by analyzing the intersection of their first N buyers, with customizable limits per token. Only accepts token contract addresses - token tickers/symbols are not supported and must be resolved to addresses first.";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the early buyers analysis'),
  data: z.array(z.object({
    trader_wallet_address: z.string().describe('Address of the early buyer'),
    transactions: z.array(z.object({
      token_address: z.string().describe('Contract address of the token bought'),
      tx_hash: z.string().describe('Transaction hash of the purchase'),
      bought_time: z.string().describe('ISO timestamp of when the purchase occurred'),
      amount_bought_usd: z.number().describe('USD value of the purchase at the time of transaction'),
    })),
  })),
});

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying early token buyers and common trading patterns.
  
  TASK: Given multiple token CONTRACT ADDRESSES (NOT token symbols/tickers) and their individual limits (optional), identify traders who were early buyers of ALL the specified tokens.
  
  CRITICAL: This agent ONLY accepts token contract addresses (e.g. 0x1234...). Token symbols or tickers like 'USDC' or 'ETH' are NOT supported and must be resolved to their contract addresses first using TokenResolverAgent.
  
  STEPS:
  1. Validate that all inputs are contract addresses (0x format) - reject any token symbols/tickers
  2. Extract the validated token addresses and their desired limits from the user query (limits are optional)
  3. Format the input as an array of objects: { token_address: string, limit?: number }[]
  4. Use early_token_buyers_fetcher tool exactly once with the formatted input and it should return the common buyers with extra data
  5. Return the analysis results
  
  The data should be sorted by the earliest buy time across all tokens for each trader.
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
    responseFormat: responseSchema,
  });
} 