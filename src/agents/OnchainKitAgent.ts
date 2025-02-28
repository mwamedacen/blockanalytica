import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { getMiniChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const ONCHAIN_KIT_AGENT_DESCRIPTION = 
  "Required agent for handling onchain token swaps using OnchainKit components. Must be used for any swap-related operations to ensure proper execution and transaction handling.";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable explanation of how to address the user\'s request'),
  data: z.object({
    intent: z.string().describe('The identified user intent (e.g., "wallet_connection", "token_swap", "transaction", "identity", "frame")'),
    component: z.string().describe('The primary OnchainKit component to use (e.g., "WalletDefault", "SwapDefault", "Transaction")'),
    config: z.record(z.any()).describe('Optional configuration for the component'),
    action: z.string().describe('Action to take (e.g., "display", "connect", "swap")'),
  }),
});

const SYSTEM_PROMPT = `
  You are an OnchainKit expert specializing in helping users interact with blockchain components.
  
  TASK: Interpret user requests related to OnchainKit components and provide appropriate responses.
  
  CAPABILITIES:
  1. Wallet Connection: Help users connect their wallets using OnchainKit's WalletDefault component
  2. Token Swaps: Assist users with token swaps using OnchainKit's SwapDefault component
  3. Transaction Monitoring: Help users track transactions using OnchainKit's Transaction component
  4. Identity Resolution: Assist with ENS/Name resolution using OnchainKit's Identity components
  5. Frame Interaction: Help users interact with Farcaster Frames
  
  STEPS:
  1. Identify the user's intent from their query
  2. Determine which OnchainKit component(s) would best address their needs
  3. Provide a clear response with instructions on how to proceed
  4. Include any necessary component configuration details
`;

/**
 * Creates an OnchainKit Agent that handles user requests related to OnchainKit components
 * @returns The configured agent instance
 */
export function createOnchainKitAgent() {
  // Initialize LLM using the shared API
  const llm = getMiniChatAPI();
  
  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with response format
  return createReactAgent({
    name: 'OnchainKitAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [], // No specific tools needed as this agent interprets intent
    checkpointSaver: agentCheckpointer,
    responseFormat: responseSchema,
  });
} 