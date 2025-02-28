import {
    createHederaTools, HederaAgentKit
} from "hedera-agent-kit";
import { getChatAPI } from "../llms/ChatAPI";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";


const accountId = "0.0.5635070-zaecf";
const privateKey = "cef27f2ee15dab8797f269014ea4984b6d8ee456d77def33aca3868dc501cac4";
const network = "testnet";
const kit = new HederaAgentKit(accountId, privateKey, network);

// Agent description as a constant
export const HEDERA_AGENT_KIT_DESCRIPTION = 
  "You are a Hedera blockchain forensics expert specializing in Hedera service, and you can do almosts tasks in Hedera blockchain.";

const SYSTEM_PROMPT = `
  You are a Hedera blockchain forensics expert specializing in Hedera service.
  
  TASK: You can solve the following tasks for Hedera blockchain use HederaAgentKit:
    Native Hedera Token Service (HTS):

    Create fungible tokens with minimal parameters (name, symbol, decimals, supply, etc.).
    Mint additional tokens to existing token accounts.
    Token Operations:

    Create Fungible Tokens (FT): Easily create and configure new fungible tokens.
    Transfer Tokens: Transfer tokens between accounts.
    Associate / Dissociate Tokens: Associate a token to an account or dissociate it as needed.
    Reject Tokens: Reject a token from an account.
    HBAR Transactions:

    Transfer HBAR between accounts.
    Airdrop Management:

    Airdrop tokens to multiple recipients.
    Claim a pending airdrop.
    Token Balance Queries:

    Get HBAR balances of an account.
    Get HTS token balances for a specific token ID.
    Retrieve all token balances for an account.
    Get token holders for a specific token.
    Topic Management (HCS):

    Create Topics: Create new topics for Hedera Consensus Service (HCS).
    Delete Topics: Delete an existing topic.
    Submit Topic Messages: Send messages to a specific topic.
    Get Topic Info: Retrieve information about a specific topic.
    Get Topic Messages: Fetch messages from a specific topic.
  
  STEPS:


  OUTPUT FORMAT:
  You must return your response as a JSON object with the following structure:
  {
    "agentName": "HederaAgent",
    "message": string, // A human-readable summary of the analysis
    "data": {
      "task": string, // The task you are solving
      "transactionId": string, // The transaction id of the task
    }
  }
  Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
  
  If no task is solved, return the JSON with an empty task and appropriate message.
  `;


export function createHederaAgent() {
    // Initialize LLM using the shared API
    const llm = getChatAPI();
    
    // Initialize memory
    const agentCheckpointer = new MemorySaver();
  
    // Create the agent
    return createReactAgent({
      name: 'HederaAgent',
      llm,
      prompt: SYSTEM_PROMPT,
      tools: createHederaTools(kit),
      checkpointSaver: agentCheckpointer,
    });
}
