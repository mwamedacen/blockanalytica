import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { FundingSourceTool } from "../tools/FundingSourceTool.ts";

// Agent description as a constant
export const RECURSIVE_FUNDING_ADDRESSES_DESCRIPTION = 
  "Recursively traces funding addresses for a target wallet to identify potential side wallets.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in tracing funding sources recursively.
  
  TASK: Given a wallet address, recursively trace its funding sources to identify potential side wallets.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Use FundingSourceTool to find the wallet that funded the target wallet
  3. For each funding wallet found, recursively apply FundingSourceTool to trace further up the chain
  4. Continue this process until no more funding sources are found or you've reached a reasonable depth (max 3 levels)
  5. Return a concise list of related wallets in the following format:
     - {wallet_address} - intel: Found via recursive funding source analysis (level X)
  
  If no related wallets are found, return "No related wallets found via funding source analysis."
  `;

/**
 * Creates a Recursive Funding Addresses Agent that traces funding sources recursively
 * @returns The configured agent instance
 */
export function createRecursiveFundingAddressesAgent() {
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
    verbose: true
  });
  
  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the funding source tool
  return createReactAgent({
    name: 'RecursiveFundingAddressesAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [FundingSourceTool],
    checkpointSaver: agentCheckpointer,
  });
} 