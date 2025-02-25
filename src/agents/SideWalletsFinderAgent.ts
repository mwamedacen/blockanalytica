import { ChatOpenAI } from "@langchain/openai";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { 
  createBidrectionalTransfersSideWalletAgent, 
  BIDIRECTIONAL_TRANSFERS_SIDE_WALLET_DESCRIPTION 
} from "./BidrectionalTransfersSideWalletAgent.ts";
import { 
  createRecursiveFundingAddressesAgent, 
  RECURSIVE_FUNDING_ADDRESSES_DESCRIPTION 
} from "./RecursiveFundingAddressesAgent.ts";

// Agent description as a constant
export const SIDE_WALLETS_FINDER_DESCRIPTION = 
  "Identifies potential side wallets associated with a target wallet through blockchain analysis.";

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
  
  // Initialize specialized agents
  const agentsMap = [
    {
      name: "BidrectionalTransfersSideWalletAgent",
      description: BIDIRECTIONAL_TRANSFERS_SIDE_WALLET_DESCRIPTION,
      instance: createBidrectionalTransfersSideWalletAgent(),
    },
    {
      name: "RecursiveFundingAddressesAgent",
      description: RECURSIVE_FUNDING_ADDRESSES_DESCRIPTION,
      instance: createRecursiveFundingAddressesAgent(),
    }
  ];

  // Create the supervisor prompt
  const supervisorPrompt = `
  You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
  
  Your task is to coordinate specialized agents to identify potential side wallets associated with a target wallet.
  
  Available agents:
  ${agentsMap.map(agent => `  - ${agent.name}: ${agent.description}`).join('\n')}
  
  For any wallet address query:
  1. Run both agents in parallel to analyze the wallet from different perspectives
  2. Combine and deduplicate the results from both agents
  3. Present a unified list of potential side wallets with clear intel on how each was discovered

  you should absolutely pass-through the full user input.
  
  Return a comprehensive analysis that synthesizes all agent findings.
  `;

  const agents = agentsMap.map(agent => agent.instance as any);
  
  // Create the supervisor with the agents
  const supervisor = createSupervisor({
    llm,
    agents,
    prompt: supervisorPrompt,
  });

  const agent = supervisor.compile({name: 'SideWalletsFinderAgent'});
  
  return agent;
}
