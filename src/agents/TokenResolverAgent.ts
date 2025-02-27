import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { DexScreenerTokenResolverTool } from "../tools/DexScreenerTokenResolverTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";

// Agent description as a constant
export const TOKEN_RESOLVER_DESCRIPTION = 
  "Resolves token tickers to their contract addresses on specific chains, using various data sources to find the most liquid token matching the query.";

const SYSTEM_PROMPT = `
  You are a blockchain token resolution expert specializing in finding token contract addresses across different chains.
  
  TASK: Given a token ticker and optionally a specific chain, resolve it to the correct token contract address.
  
  STEPS:
  1. Extract the token ticker and optional chain from the user query
  2. Use dexscreener_token_resolver tool to find the token with highest liquidity matching the query
  3. Return the analysis results in the required JSON format
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "TokenResolverAgent",
    "message": string, // A human-readable summary of the resolution
    "data": {
      "address": string,
      "name": string,
      "symbol": string,
      "chain": string
    }
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  The message should include:
  1. The resolved token name and symbol
  2. The chain it was found on
  3. The current liquidity in USD
  
  EXAMPLE QUERY FORMATS:
  1. "Resolve USDC on Base"
  2. "Find contract address for WETH"  // will default to Base chain
  `;

/**
 * Creates a Token Resolver Agent that resolves token tickers to contract addresses
 * @returns The configured agent instance
 */
export function createTokenResolverAgent() {
  // Initialize LLM using the shared API
  const llm = getChatAPI();
  
  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the token resolver tool
  return createReactAgent({
    name: 'TokenResolverAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [DexScreenerTokenResolverTool],
    checkpointSaver: agentCheckpointer,
  });
} 