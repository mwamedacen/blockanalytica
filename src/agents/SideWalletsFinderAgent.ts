import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool";
import { FundingSourceTool } from "../tools/FundingSourceTool";
import { getMiniChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const SIDE_WALLETS_FINDER_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns. Wallet addresses could be Ethereum or Solana.";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the analysis'),
  data: z.array(z.object({
    wallet_address: z.string().describe('The identified side wallet address'),
    intel_description: z.string().describe('Indicates if wallet was found via bidirectional transfers and/or funding source analysis'),
  })),
});

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
  
  TASK: Given a wallet address, identify potential side wallets by analyzing both bidirectional transfers and funding sources in parallel.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. In parallel:
     a. Use BidrectionalTransfersTool to find wallets with two-way transfer patterns
     b. Use FundingSourceTool to trace funding address
  3. Combine and deduplicate results from both analysis paths
  4. Return the analysis results
`;

/**
 * Creates a Side Wallets Finder Agent that identifies potential side wallets
 * @returns The configured agent instance
 */
export function createSideWalletsFinderAgent() {
  const llm = getMiniChatAPI();
  const agentCheckpointer = new MemorySaver();

  return createReactAgent({
    name: 'SideWalletsFinderAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [BidrectionalTransfersTool, FundingSourceTool],
    checkpointSaver: agentCheckpointer,
    responseFormat: responseSchema,
  });
}
