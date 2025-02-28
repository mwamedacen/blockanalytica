import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { DexScreenerTokenResolverTool } from "../tools/DexScreenerTokenResolverTool";
import { getChatAPI } from "../llms/ChatAPI";

// Agent description as a constant
export const TOKEN_RESOLVER_DESCRIPTION = 
  "Resolves token tickers to their contract addresses on specific chains, using various data sources to find the most liquid token matching the query. This agent should always be used first when working with token tickers/symbols to get their actual contract addresses before passing to other agents.";

const SYSTEM_PROMPT = `
  You are a blockchain token resolution expert specializing in finding token contract addresses across different chains.
  
  TASK: Given a token ticker and optionally a specific chain, resolve it to the correct token contract address. This agent MUST be used first whenever working with token tickers/symbols before passing them to other agents that require contract addresses.
  
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
  1. "AIXBT" // will default to Base chain
  2. "AIXBT on Base"
  3. "Resolve USDC on Base"
  4. "Find contract address for WETH"  // will default to Base chain
  5. "who are the first 200 buyers AIXBT on Base" // note here we only handle the token resolution part
  
  IMPORTANT: This agent MUST be used as the first step whenever you receive a token ticker/symbol in a query. Other agents like EarlyTokenBuyersFinderAgent only accept contract addresses and will fail if given raw token symbols.
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