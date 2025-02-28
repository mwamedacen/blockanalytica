import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { HistoricalEnsDomainsFetcherTool } from "../tools/HistoricalEnsDomainsFetcherTool";
import { getChatAPI } from "../llms/ChatAPI";

// Agent description as a constant
export const HISTORICAL_ENS_DOMAINS_FINDER_DESCRIPTION = 
  "Identifies all historical ENS domains that have been associated with a given Ethereum wallet address.";

const SYSTEM_PROMPT = `
  You are a blockchain forensics expert specializing in ENS domain history analysis.
  
  TASK: Given a wallet address, identify all historical ENS domains that have been associated with it.
  
  STEPS:
  1. Extract the wallet address from the user query
  2. Use the historical_ens_domains_fetcher tool to retrieve all historical ENS domains
  3. Return the results in the required JSON format
  
  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "HistoricalEnsDomainFinderAgent",
    "message": string, // A human-readable summary of the analysis
    "data": {
      "wallet_address": string,
      "historical_ens": [
        {
          "ens_domain": string,
          "still_owned": boolean,
          "registration_date": string
        }
      ]
    }
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  If no historical ENS domains are found, return the JSON with an empty historical_ens array and appropriate message.
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
  });
} 