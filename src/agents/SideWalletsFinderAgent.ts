import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { BidrectionalTransfersTool } from "../tools/BidrectionalTransfersTool";

export class SideWalletsFinderAgent {
  // Public description for the agent registry
  public static description = "Identifies potential side wallets associated with a target wallet by analyzing bidirectional transfer patterns.";
  
  private agent;

  constructor() {
    // Check for required API keys
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey
    });

    // Initialize memory
    const agentCheckpointer = new MemorySaver();

    // Create the agent with the bidirectional transfers tool
    this.agent = createReactAgent({
      llm,
      tools: [BidrectionalTransfersTool],
      checkpointSaver: agentCheckpointer,
    });
  }

  /**
   * Process a user query to find side wallets
   * @param userInput The user's text input containing a wallet address
   * @returns Analysis of potential side wallets
   */
  async processQuery(userInput: string): Promise<string> {
    console.log(`SideWalletsFinderAgent processing: "${userInput}"`);
    
    const prompt = `
    You are a blockchain forensics expert specializing in identifying side wallets and related addresses.
    
    USER QUERY: ${userInput}
    
    TASK: Identify potential side wallets associated with the wallet address mentioned in the user query.
    
    STEPS:
    1. Extract the wallet address from the user query
    2. Use all available tools to analyze relationships between wallets
    3. Return a concise list of related wallets in the following format:
       - {wallet_address} - intel: {intel} where intel is short human readable sentence explaining which tools got used
    
    If no related wallets are found, return "No related wallets found."
    `;

    try {
      const result = await this.agent.invoke({
        messages: [{ role: "user", content: prompt }],
      }, {
        configurable: {
          thread_id: `side_wallets_${Date.now()}`
        }
      });

      // Extract the result from the agent's response
      const lastMessage = result.messages[result.messages.length - 1].content;
      return lastMessage.toString();
    } catch (error: any) {
      console.error("Error finding side wallets:", error);
      throw new Error(`Side wallets analysis failed: ${error.message}`);
    }
  }
} 