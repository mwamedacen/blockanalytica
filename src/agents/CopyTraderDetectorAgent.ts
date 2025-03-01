import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { WalletSwapsRetrieverTool } from "../tools/WalletSwapsRetrieverTool";
import { TokenSwapsRetrieverTool } from "../tools/TokenSwapsRetrieverTool";
import { getMiniChatAPI } from "../llms/ChatAPI";
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
  2. Retrieve recent swap activity (up to 10 swaps in last 2 months, ordered by most recent first) for the target address using wallet_swaps_retriever
  3. From these 10 most recent swaps, identify and select the 3 most recent swaps that involve different tokens. For example:
    If the swaps are:
    - Swap #1: TokenA
    - Swap #2: TokenB  
    - Swap #3: TokenB
    - Swap #4: TokenC
    Then select swaps #1, #2, and #4 as they represent 3 distinct tokens (TokenA, TokenB, TokenC)
  4. For each selected swap, retrieve other wallets that traded the same tokens shortly after using token_swaps_retriever (here you can check up to 100 swaps)
  5. Identify wallets that consistently trade the same tokens shortly after the target address
  6. Generate a detailed analysis for the 3 picked tokens:
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
    - Begin the analysis message by briefly explaining the methodology used, e.g. "Looking at the last 3 distinct token swaps from the target wallet, we identified..."

  In general, you MUST report the total number of copy traders, amount traded by target wallet versus copy traders and the ratio.
  </IMPORTANT_CONSTRAINTS>
`;
/**
 * Creates a Copy Trader Detector Agent that analyzes potential copy trading behavior
 * @returns The configured agent instance
 */
export function createCopyTraderDetectorAgent() {
  // Initialize LLM using the shared API
  const llm = getMiniChatAPI();

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
