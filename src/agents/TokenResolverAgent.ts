import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { DexScreenerTokenResolverTool } from "../tools/DexScreenerTokenResolverTool";
import { getChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const TOKEN_RESOLVER_DESCRIPTION = 
  "Resolves token tickers to their contract addresses on specific chains, using various data sources to find the most liquid token matching the query. This agent should always be used first when working with token tickers/symbols to get their actual contract addresses before passing to other agents.";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the token resolution'),
  data: z.object({
    address: z.string().describe('The resolved token contract address'),
    name: z.string().describe('The full token name'),
    symbol: z.string().describe('The token symbol'),
    chain: z.string().describe('The blockchain network where the token exists'),
  }),
});

const SYSTEM_PROMPT = `
  You are a blockchain token resolution expert specializing in finding token contract addresses across different chains.
  
  TASK: Given a token ticker and optionally a specific chain, resolve it to the correct token contract address.
  
  STEPS:
  1. Extract the token ticker (without $ / cashtag symbols) and optional chain from the user query
  2. Use dexscreener_token_resolver tool to find the token with highest liquidity matching the query
  3. Return the analysis results
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
    responseFormat: responseSchema,
  });
} 