import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool.ts";
import { FundingSourceTool } from "../tools/FundingSourceTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";
import { mintStoryIP, mintAndRegisterIpAndMakeDerivative } from "../story/StoryNFT.ts";

// Agent description as a constant
export const SIDE_WALLETS_FINDER_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns. Wallet addresses could be Ethereum or Solana.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
  
  TASK: Given a wallet address, identify potential side wallets by analyzing both bidirectional transfers and funding sources in parallel.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. In parallel:
     a. Use BidrectionalTransfersTool to find wallets with two-way transfer patterns
     b. Use FundingSourceTool to trace funding address
  3. Combine and deduplicate results from both analysis paths
  4. Return the analysis results in the required JSON format
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "SideWalletsFinderAgent",
    "message": string, // A human-readable summary of the analysis
    "data": [
      {
        "wallet_address": string,
        "intel_description": string, // Indicates if wallet was found via bidirectional transfers and/or funding source analysis
      }
    ]
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  If no related wallets are found, return the JSON with an empty data array and appropriate message.
  `;

/**
 * Creates a Side Wallets Finder Agent that identifies potential side wallets
 * @returns The configured agent instance
 */
export function createSideWalletsFinderAgent() {

  if (process.env.IP_ENABLED && !mintAndRegisterIpAndMakeDerivative()) return null;

  // Initialize LLM using the shared API
  const llm = getChatAPI();
  
  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the bidirectional transfers tool
  return createReactAgent({
    name: 'SideWalletsFinderAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [BidrectionalTransfersTool, FundingSourceTool],
    checkpointSaver: agentCheckpointer,
  });
}
