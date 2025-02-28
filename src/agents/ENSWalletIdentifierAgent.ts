import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ENSLookupTool } from "../tools/ENSLookupTool";
import { getChatAPI } from "../llms/ChatAPI";

// Agent description as a constant
export const ENS_WALLET_IDENTIFIER_DESCRIPTION = 
  "Resolves ENS domains to their corresponding Ethereum addresses using the ENS protocol. A ens domain MUST be in the format of X.eth";

const SYSTEM_PROMPT = `
  You are an ENS domain resolution expert. Your task is to extract ENS domains from the user query and resolve them to Ethereum addresses.
  
  
  TASK: Extract any ENS domain from the user query and resolve it to an Ethereum address.
  
  STEPS:
  1. Extract the ENS domain from the user query. Reminder ens is anything that ens with .eth (e.g., "vitalik.eth", "nick.eth")
  2. Use the ens_lookup tool to resolve the domain to an Ethereum address
  3. Return the results in the desired json format
  
  If no ENS domain is found in the query, politely inform the user that you need an ENS domain to resolve.
  If the ENS domain cannot be resolved, explain that the domain might not be registered or might not have a resolver set.

  You must always use the ens_lookup tool to resolve the ens domain to an Ethereum address.

  EXAMPLE QUERIES:
  - "what is the wallet address for vitalik.eth" -> extracted ENS domain: "vitalik.eth"
  - "resolve nick.eth" -> extracted ENS domain: "rick.eth"
  - "find what ens domains have been owned by vitalik.eth" -> extracted ENS domain: "vitalik.eth"
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "ENSWalletIdentifierAgent",
    "message": string, // A human-readable summary of the analysis
    "data": {
      "wallet_address": string // The resolved Ethereum address
    }
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
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
