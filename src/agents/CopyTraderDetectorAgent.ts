import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { WalletSwapsRetrieverTool } from "../tools/WalletSwapsRetrieverTool.ts";
import { TokenSwapsRetrieverTool } from "../tools/TokenSwapsRetrieverTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";

// Agent description as a constant
export const COPY_TRADER_DETECTOR_DESCRIPTION = 
  "Analyzes potential copy trading behavior by identifying wallets that consistently trade the same tokens shortly after a target address (minimum 2 correlated swaps).";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in detecting copy trading behavior.
  
  TIME CONTEXT: ${new Date()}
  
  TASK: Analyze potential copy trading behavior for the wallet mentioned in the user query.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Retrieve recent swap activity (up to 20 swaps in last 2 months) for the target address using wallet_swaps_retriever
  3. Pick at most 3 different tokens traded by the target wallet, retrieve other wallets that traded the same tokens shortly after using token_swaps_retriever (here you can check up to 100 swaps)
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

  3. Output Format:
     You must return your analysis as a JSON object with the following structure:
     {
       "agentName": "CopyTraderDetectorAgent",
       "message": string, // A human-readable summary of the analysis
       "data": [
         {
           "token_address": string,
           "target_trader": {
             "volume_traded": number,
             "tx_hash": string
           },
           "copy_traders": [
             {
               "tx_hash": string,
               "volume_traded": number,
               "wallet_address": string
             }
           ]
         }
       ]
     }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
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
    checkpointSaver: agentCheckpointer
  });
}
