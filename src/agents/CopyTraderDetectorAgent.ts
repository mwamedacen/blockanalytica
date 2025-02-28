import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { WalletSwapsRetrieverTool } from "../tools/WalletSwapsRetrieverTool";
import { TokenSwapsRetrieverTool } from "../tools/TokenSwapsRetrieverTool";
import { getChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const COPY_TRADER_DETECTOR_DESCRIPTION = 
  "Analyzes potential copy trading behavior by identifying wallets that consistently trade the same tokens shortly after a target address (minimum 2 correlated swaps).";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the copy trading analysis'),
  data: z.array(z.object({
    token_address: z.string().describe('The contract address of the analyzed token'),
    target_trader: z.object({
      volume_traded: z.number().describe('Total volume traded by the target wallet in USD'),
      tx_hash: z.string().describe('Transaction hash of a representative trade'),
    }),
    copy_traders: z.array(z.object({
      tx_hash: z.string().describe('Transaction hash of the copy trade'),
      volume_traded: z.number().describe('Volume traded by this copy trader in USD'),
      wallet_address: z.string().describe('Address of the copy trading wallet'),
    })),
  })),
});

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in detecting copy trading behavior.
  
  TIME CONTEXT: ${new Date()}
  
  TASK: Analyze potential copy trading behavior for the wallet mentioned in the user query.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Retrieve recent swap activity (up to 20 swaps in last 2 months) for the target address using wallet_swaps_retriever
  3. Pick at most 3 different swaps involving different tokens (if only swaps with same token are found, deduplicate to take one swap), then retrieve other wallets that traded the same tokens shortly after using token_swaps_retriever (here you can check up to 100 swaps)
  4. Identify wallets that consistently trade the same tokens shortly after the target address
  5. Generate a detailed analysis for the 3 picked tokens:
     - Total number of potential copy trading wallets detected
     - Volume traded by the user vs the cumulative volume traded by copy traders and the ratio
     - Example of 3 addresses of copy traders
  
  <IMPORTANT_CONSTRAINTS>
  For each token analyzed (maximum 3 tokens):
  1. Copy Trading Detection Rules:
     - Only consider BUY transactions that occur within 5 minutes after the target wallet's BUY
     - A wallet must have at least 3 correlated BUY transactions to be considered a copy trader
     - Correlated means buying the same token within the 5-minute window after target wallet
  
  2. Analysis Requirements:
     - Report the TOTAL number of unique wallets identified as copy traders across all analyzed tokens
     - For volume analysis, provide:
         * The exact volume traded by the target wallet
         * The total combined volume traded by ALL copy traders
         * The ratio between these volumes (copy traders volume / target wallet volume)
     - Include 3 example copy trader addresses (these are just samples, not the complete list)
  </IMPORTANT_CONSTRAINTS>
`;
/**
 * Creates a Copy Trader Detector Agent that analyzes potential copy trading behavior
 * @returns The configured agent instance
 */
export function createCopyTraderDetectorAgent() {
  // Initialize LLM using the shared API
  const llm = getChatAPI();

  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with functional tools
  return createReactAgent({
    name: 'CopyTraderDetectorAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [
      WalletSwapsRetrieverTool,
      TokenSwapsRetrieverTool
    ],
    checkpointSaver: agentCheckpointer,
    responseFormat: responseSchema,
  });
}
