import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool.ts";

// Agent description as a constant
export const BIDIRECTIONAL_TRANSFERS_SIDE_WALLET_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying side wallets through bidirectional transfer patterns.
  
  TASK: Given a wallet address, identify potential side wallets by analyzing bidirectional transfers.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Use BidrectionalTransfersTool to find wallets with two-way transfer patterns
  3. Return a concise list of related wallets in the following format:
     - {wallet_address} - intel: Found via bidirectional transfers analysis
  
  If no related wallets are found, return "No related wallets found via bidirectional transfers."
  `;

/**
 * Creates a Bidirectional Transfers Side Wallet Agent that identifies potential side wallets
 * @returns The configured agent instance
 */
export function createBidrectionalTransfersSideWalletAgent() {
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
    name: 'BidrectionalTransfersSideWalletAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [BidrectionalTransfersTool],
    checkpointSaver: agentCheckpointer,
  });
} 