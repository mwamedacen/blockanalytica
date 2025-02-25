import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { CopyTraderResult } from "../types";
import { WalletSwapsRetrieverTool } from "../tools/WalletSwapsRetrieverTool";
import { TokenSwapsRetrieverTool } from "../tools/TokenSwapsRetrieverTool";

export class CopyTraderDetectorAgent {
  // Public description for the agent registry
  public static description = "Analyzes potential copy trading behavior by identifying wallets that consistently trade the same tokens shortly after a target address (minimum 2 correlated swaps).";
  
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

    // Create the agent with functional tools
    this.agent = createReactAgent({
      llm,
      tools: [
        WalletSwapsRetrieverTool,
        TokenSwapsRetrieverTool
      ],
      checkpointSaver: agentCheckpointer,

    });
  }

  /**
   * Process a user query directly
   * @param userInput The user's text input
   * @returns Analysis of potential copy trading behavior
   */
  async processQuery(userInput: string): Promise<string> {
    console.log(`CopyTraderDetectorAgent processing: "${userInput}"`);
    
    const prompt = `
    You are a blockchain forensics expert specializing in detecting copy trading behavior.
    
    USER QUERY: ${userInput}

    TIME CONTEXT: ${new Date()}
    
    TASK: Analyze potential copy trading behavior for the wallet mentioned in the user query.
    
    STEPS:
    1. Extract the wallet address from the user query
    2. Retrieve recent swap activity (up to 20 swaps in last 2 months) for the target address using wallet_swaps_retriever
    3. Pick at most 3 different tokens traded by the target wallet, retrieve other wallets that traded the same tokens shortly after using token_swaps_retriever (here you can check up to 100 swaps)
    4. Identify wallets that consistently trade the same tokens shortly after the target address
    5. Generate a detailed analysis for the 3 picked tokens:
       - Total number of potential copy trading wallets detected
       - Volume traded by the user vs the cumulative volume traded by copy traders and the ratio
       - Example of 3 addresses of copy traders
    
    <IMPORTANT_CONSTRAINTS>
    For each token analyzed (maximum 3 tokens):
    1. Copy Trading Detection Rules:
       - Only consider BUY transactions that occur within 5 minutes after the target wallet's BUY
       - A wallet must have at least 3 correlated BUY transactions to be considered a copy trader
       - Correlated means buying the same token within the 5-minute window after target wallet
    
    2. Analysis Requirements:
       - Report the TOTAL number of unique wallets identified as copy traders across all analyzed tokens
       - For volume analysis, provide:
           * The exact volume traded by the target wallet
           * The total combined volume traded by ALL copy traders
           * The ratio between these volumes (copy traders volume / target wallet volume)
       - Include 3 example copy trader addresses (these are just samples, not the complete list)
    Return the analysis in form of text and nothign else.
    </IMPORTANT_CONSTRAINTS>
    `;

    try {
      const result = await this.agent.invoke({
        messages: [{ role: "user", content: prompt }],
      }, {
        configurable: {
          thread_id: 'test_thread' // fixme
        }
      });

      // Extract the JSON result from the agent's response
      const lastMessage = result.messages[result.messages.length - 1].content;
      
      /*
      let jsonResult: CopyTraderResult;

      try {
        // Try to extract JSON from the message content
        const content = typeof lastMessage === 'string' 
          ? lastMessage 
          : JSON.stringify(lastMessage);
          
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/);
                          
        if (jsonMatch) {
          jsonResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (error: any) {
        console.error("Error parsing JSON result:", error);
        throw new Error("Failed to parse copy trader detection results");
      }

      return jsonResult;
      */
     return lastMessage.toString();
    } catch (error: any) {
      console.error("Error detecting copy traders:", error);
      throw new Error(`Copy trader detection failed: ${error.message}`);
    }
  }
} 