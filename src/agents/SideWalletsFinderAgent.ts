import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool.ts";
import { FundingSourceTool } from "../tools/FundingSourceTool.ts";

// Agent description as a constant
export const SIDE_WALLETS_FINDER_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
  
  TASK: Given a wallet address, identify potential side wallets by analyzing both bidirectional transfers and funding sources in parallel.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. In parallel:
     a. Use BidrectionalTransfersTool to find wallets with two-way transfer patterns
     b. Use FundingSourceTool recursively to trace funding addresses, call it on each discovered address until no more are found 
  3. Combine and deduplicate results from both analysis paths
  4. Return a concise list of related wallets in the following format:
     - {wallet_address} - intel: {intel} where intel indicates if wallet was found via bidirectional transfers and/or funding source analysis
  
  If no related wallets are found, return "No related wallets found."
  `;

/**
 * Creates a Side Wallets Finder Agent that identifies potential side wallets
 * @returns The configured agent instance
 */
export function createSideWalletsFinderAgent() {
  // Check for required API keys
  const openAIApiKey = process.env.OPENAI_API_KEY;
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey,
  });
  
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
