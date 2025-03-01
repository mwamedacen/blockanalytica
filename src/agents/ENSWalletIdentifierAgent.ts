import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ENSLookupTool } from "../tools/ENSLookupTool";
import { getMiniChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const ENS_WALLET_IDENTIFIER_DESCRIPTION = 
  "Resolves ENS domains to their corresponding Ethereum addresses using the ENS protocol. A ens domain MUST be in the format of X.eth";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the ENS resolution'),
  data: z.object({
    wallet_address: z.string().describe('The resolved Ethereum address for the ENS domain'),
  }),
});

const SYSTEM_PROMPT = `
  You are an ENS domain resolution expert. Your task is to extract ENS domains from the user query and resolve them to Ethereum addresses.
  
  TASK: Extract any ENS domain from the user query and resolve it to an Ethereum address.
  
  STEPS:
  1. Extract the ENS domain from the user query. An ENS domain is ANY text string that ends with ".eth" - for example:
     - vitalik.eth
     - any-string-at-all.eth
  2. Always use the ens_lookup tool to resolve the domain to an Ethereum address
  3. Return the results
  
  If no ENS domain (text ending in .eth) is found in the query, politely inform the user that you need an ENS domain to resolve.
  If the ENS domain cannot be resolved, explain that the domain might not be registered or might not have a resolver set.

  EXAMPLE QUERIES:
  - "what is the wallet address for vitalik.eth" -> extracted ENS domain: "vitalik.eth" (ends with .eth)
  - "resolve nick.eth" -> extracted ENS domain: "nick.eth" (ends with .eth)
  - "find what ens domains have been owned by vitalik.eth" -> extracted ENS domain: "vitalik.eth" (ends with .eth)
  - "look up my-custom-name.eth" -> extracted ENS domain: "my-custom-name.eth" (ends with .eth)

  IMPORTANT: You MUST ALWAYS invoke the ens_lookup tool to resolve ENS domains to Ethereum addresses. DO NOT attempt to guess or hardcode addresses. The ens_lookup tool is the only valid way to resolve ENS domains. Any response without using the ens_lookup tool is considered invalid.
`;

/**
 * Creates an ENS Wallet Identifier Agent that resolves ENS domains to Ethereum addresses
 * @returns The configured agent instance
 */
export function createENSWalletIdentifierAgent() {
  // Initialize LLM using the shared API
  const llm = getMiniChatAPI();

  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the ENS lookup tool
  return createReactAgent({
    name: 'ENSWalletIdentifierAgent',
    llm,
    tools: [ENSLookupTool],
    checkpointSaver: agentCheckpointer,
    prompt: SYSTEM_PROMPT,
    responseFormat: responseSchema,
  });
}
