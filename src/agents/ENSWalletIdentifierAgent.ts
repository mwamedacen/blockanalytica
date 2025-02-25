import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ENSLookupTool } from "../tools/ENSLookupTool";

export class ENSWalletIdentifierAgent {
  // Public description for the agent registry
  public static description = "Resolves ENS domains to their corresponding Ethereum addresses using the ENS protocol.";
  
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

    // Create the agent with the ENS lookup tool
    this.agent = createReactAgent({
      llm,
      tools: [ENSLookupTool],
      checkpointSaver: agentCheckpointer,
    });
  }

  /**
   * Process a user query to resolve an ENS domain
   * @param userInput The user's text input containing an ENS domain
   * @returns The resolved Ethereum address
   */
  async processQuery(userInput: string): Promise<string> {
    console.log(`ENSWalletIdentifierAgent processing: "${userInput}"`);
    
    const prompt = `
    You are an ENS domain resolution expert. Your task is to extract ENS domains from the user query and resolve them to Ethereum addresses.
    
    USER QUERY: ${userInput}
    
    TASK: Extract any ENS domain from the user query and resolve it to an Ethereum address.
    
    STEPS:
    1. Extract the ENS domain from the user query (e.g., "vitalik.eth", "nick.eth")
    2. Use the ens_lookup tool to resolve the domain to an Ethereum address
    3. Return the results in a clear, human-readable format
    
    If no ENS domain is found in the query, politely inform the user that you need an ENS domain to resolve.
    If the ENS domain cannot be resolved, explain that the domain might not be registered or might not have a resolver set.
    `;

    try {
      const result = await this.agent.invoke({
        messages: [{ role: "user", content: prompt }],
      }, {
        configurable: {
          thread_id: `ens_lookup_${Date.now()}`
        }
      });

      // Extract the result from the agent's response
      const lastMessage = result.messages[result.messages.length - 1].content;
      return lastMessage.toString();
    } catch (error: any) {
      console.error("Error resolving ENS domain:", error);
      throw new Error(`ENS resolution failed: ${error.message}`);
    }
  }
} 