import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { HistoricalEnsDomainsFetcherTool } from "../tools/HistoricalEnsDomainsFetcherTool";
import { getChatAPI } from "../llms/ChatAPI";
import { z } from "zod";

// Agent description as a constant
export const HISTORICAL_ENS_DOMAINS_FINDER_DESCRIPTION = 
  "Identifies all historical ENS domains that have been associated with a given Ethereum wallet address.";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the historical ENS domains found'),
  data: z.object({
    wallet_address: z.string().describe('The wallet address being analyzed'),
    historical_ens: z.array(z.object({
      ens_domain: z.string().describe('The ENS domain name'),
      still_owned: z.boolean().describe('Whether the wallet still owns this domain'),
      registration_date: z.string().describe('ISO timestamp of when the domain was first registered'),
    })),
  }),
});

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in ENS domain history analysis.
  
  TASK: Given a wallet address, identify all historical ENS domains that have been associated with it.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Use the historical_ens_domains_fetcher tool to retrieve all historical ENS domains
  3. Return the results
  
  If no historical ENS domains are found, return an empty result with appropriate message.
`;

/**
 * Creates a Historical ENS Domains Finder Agent that identifies all ENS domains associated with a wallet
 * @returns The configured agent instance
 */
export function createHistoricalEnsDomainsFinderAgent() {
  // Initialize LLM using the shared API
  const llm = getChatAPI();

  // Initialize memory
  const agentCheckpointer = new MemorySaver();

  // Create the agent with the historical ENS domains fetcher tool
  return createReactAgent({
    name: 'HistoricalEnsDomainFinderAgent',
    llm,
    prompt: SYSTEM_PROMPT,
    tools: [HistoricalEnsDomainsFetcherTool],
    checkpointSaver: agentCheckpointer,
    responseFormat: responseSchema,
  });
} 