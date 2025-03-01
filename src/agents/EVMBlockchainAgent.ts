import { EVMKit } from "@hiero-ai/evm-agent-kit";
import { base, Chain } from "viem/chains"; // or any other chain
import { getChatAPI, getMiniChatAPI } from "../llms/ChatAPI";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseWallet } from "ethers";

// Define the response schema
const responseSchema = z.object({
  agentName: z.string(),
  message: z.string().describe('A human-readable summary of the EVM blockchain agent actions'),
  data: z.array(z.object({
    task: z.string().describe('The task you are solving'),
    transactionId: z.string().describe('The transaction id of the task')
  })),
});

const network = process.env.BASE_NETWORK!;

const signatureExplorerUrl = (tx: string) =>
  network === "mainnet"
    ? `https://basescan.org/tx/${tx}`
    : `https://sepolia.basescan.org/tx/${tx}`;

const walletExplorerUrl = (address: string) =>
  network === "mainnet"
    ? `https://basescan.org/address/${address}`
    : `https://sepolia.basescan.org/address/${address}`;

/**
 * This tool is used to get the balance of an EVM wallet.
 */
const balanceSchema = z.object({
  address: z.string().describe("The wallet address to check balance for."),
});

export class evmBalanceTool extends DynamicStructuredTool {
  constructor(private evmKit: EVMKit) {
    const fields = {
      name: "evm_balance",
      description: "Get the native balance of an EVM wallet.",
      schema: balanceSchema,
      func: async (params: z.infer<typeof balanceSchema>) => {
        const balance = await this.evmKit.getBalance(params.address);
        return `${balance} ETH`;
      },
    };
    super(fields);
  }
}

/**
 * This tool is used to transfer ETH or ERC20 tokens to another address.
 */
const transferSchema = z.object({
  to: z.string().describe("The wallet address to transfer to."),
  amount: z.string().describe("The amount of tokens to transfer."),
  tokenAddress: z
    .string()
    .describe("The ERC20 token address to transfer.")
    .optional(),
});

export class evmTransferTool extends DynamicStructuredTool {
  constructor(private evmKit: EVMKit) {
    const fields = {
      name: "evm_transfer",
      description: "Transfer ETH or ERC20 tokens to another address.",
      schema: transferSchema,
      func: async (params: z.infer<typeof transferSchema>) => {
        try {
          if (!params.tokenAddress) {
            const tx = await this.evmKit.transfer(params.to, params.amount);
            return `Transaction sent. View on ${signatureExplorerUrl(tx)}`;
          } else {
            const tx = await this.evmKit.erc20Transfer(
              params.tokenAddress,
              params.to,
              params.amount
            );
            return `Transaction sent. View on ${signatureExplorerUrl(tx)}`;
          }
        } catch (error: any) {
          return JSON.stringify({
            status: "error",
            message: error.message,
          });
        }
      },
    };
    super(fields);
  }
}

export const createEvmTools = (evmKit: EVMKit) => {
  return [
    //
    new evmBalanceTool(evmKit),
    new evmTransferTool(evmKit),
  ];
};

// Agent description as a constant
export const EVM_BLOCKCHAIN_AGENT_KIT_DESCRIPTION = 
  "You are a EVM blockchain forensics expert specializing in EVM service, and you can do almosts tasks in supported EVM blockchain.";

const SYSTEM_PROMPT = `
  You are a EVM blockchain forensics expert specializing in EVM service.
  
  TASK: You can solve the following tasks for EVM blockchain use EVMAgentKit:
    Native EVM Token Service:

    Create fungible tokens with minimal parameters (name, symbol, decimals, supply, etc.).
    Mint additional tokens to existing token accounts.
    Token Operations:

    Create Fungible Tokens (FT): Easily create and configure new fungible tokens.
    Transfer Tokens: Transfer tokens between accounts.
    Associate / Dissociate Tokens: Associate a token to an account or dissociate it as needed.
    Reject Tokens: Reject a token from an account.
    EVM Transactions:

    Transfer EVM between accounts.
    Airdrop Management:

    Airdrop tokens to multiple recipients.
    Claim a pending airdrop.
    Token Balance Queries:

    Get EVM balances of an account.
    Retrieve all token balances for an account.
    Get token holders for a specific token.
    Topic Management (HCS):

    Create Topics: Create new topics for EVM Consensus Service (ECS).
    Delete Topics: Delete an existing topic.
    Submit Topic Messages: Send messages to a specific topic.
    Get Topic Info: Retrieve information about a specific topic.
    Get Topic Messages: Fetch messages from a specific topic.
  
  `;


export function createEVMBlockchainAgent(wallet: BaseWallet, chain: Chain) {
  try {
    const agent = new EVMKit(wallet.privateKey, chain);

    // Initialize LLM using the shared API
    const llm = getMiniChatAPI();
    
    // Initialize memory
    const agentCheckpointer = new MemorySaver();
 
    const tools = createEvmTools(agent);

    // Create the agent
    return createReactAgent({
      name: 'EVMBlockchainAgent',
      llm,
      prompt: SYSTEM_PROMPT + " your wallet address: " + wallet.address,
      tools,
      checkpointSaver: agentCheckpointer,
      responseFormat: responseSchema,
    });
  } catch (error) {
    console.error("Error creating EVMBlockchainAgent:", error);
    throw error;
  }
}
