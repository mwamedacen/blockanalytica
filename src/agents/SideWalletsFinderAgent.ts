import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool.ts";

// Agent description as a constant
export const SIDE_WALLETS_FINDER_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
  
  TASK: Identify potential side wallets associated with the wallet address mentioned in the user query.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Use all available tools to analyze relationships between wallets
  3. Return a concise list of related wallets in the following format:
     - {wallet_address} - intel: {intel} where intel is short human readable sentence explaining which tools got used
  
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
    tools: [BidrectionalTransfersTool],
    checkpointSaver: agentCheckpointer,
  });
}
