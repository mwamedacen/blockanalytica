import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ENSLookupTool } from "../tools/ENSLookupTool.ts";
import { getChatAPI } from "../llms/ChatAPI.ts";

// Agent description as a constant
export const ENS_WALLET_IDENTIFIER_DESCRIPTION = 
  "Resolves ENS domains to their corresponding Ethereum addresses using the ENS protocol. A ens domain MUST be in the format of X.eth";

const SYSTEM_PROMPT = `
  You are an ENS domain resolution expert. Your task is to extract ENS domains from the user query and resolve them to Ethereum addresses.
  
  
  TASK: Extract any ENS domain from the user query and resolve it to an Ethereum address.
  
  STEPS:
  1. Extract the ENS domain from the user query (e.g., "vitalik.eth", "nick.eth")
  2. Use the ens_lookup tool to resolve the domain to an Ethereum address
  3. Return the results in a clear, human-readable format
  
  If no ENS domain is found in the query, politely inform the user that you need an ENS domain to resolve.
  If the ENS domain cannot be resolved, explain that the domain might not be registered or might not have a resolver set.
  `

/**
 * Creates an ENS Wallet Identifier Agent that resolves ENS domains to Ethereum addresses
 * @returns The configured agent instance
 */
export function createENSWalletIdentifierAgent() {
  // Initialize LLM using the shared API
  const llm = getChatAPI();

  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the ENS lookup tool
  return createReactAgent({
    name: 'ENSWalletIdentifierAgent',
    llm,
    tools: [ENSLookupTool],
    checkpointSaver: agentCheckpointer,
    prompt: SYSTEM_PROMPT
  });
}
