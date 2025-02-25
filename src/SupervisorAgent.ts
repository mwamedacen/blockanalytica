import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { CopyTraderDetectorAgent } from "./agents/CopyTraderDetectorAgent";

// Define available agent classes
const AVAILABLE_AGENTS = [
  CopyTraderDetectorAgent
];

// Simple agent info interface
interface AgentInfo {
  name: string;
  description: string;
  instance: any;
}

export class SupervisorAgent {
  private llm: ChatOpenAI;
  private agents: AgentInfo[] = [];

  constructor() {
    // Check for required API keys
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // Initialize LLM for the supervisor
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey
    });

    // Initialize all available agents
    for (const AgentClass of AVAILABLE_AGENTS) {
      this.agents.push({
        name: AgentClass.name,
        description: AgentClass.description,
        instance: new AgentClass()
      });
    }
  }

  /**
   * Process a user query and route to the appropriate agent
   */
  async processQuery(userInput: string): Promise<any> {
    console.log(`Processing user query: "${userInput}"`);
    
    // Create agent descriptions for the prompt
    const agentDescriptions = this.agents
      .map(agent => `- ${agent.name}: ${agent.description}`)
      .join('\n');

    // Create the prompt for agent selection
    const prompt = `
    You are an expert blockchain analysis supervisor. Your task is to analyze the user query and select the most appropriate specialized agent to handle it.

    Available agents:
    ${agentDescriptions}

    User query: "${userInput}"

    Based on the user query, determine which agent should handle this query.
    Respond in the following JSON format only:
    {
      "agentName": "Name of the selected agent",
      "reasoning": "Brief explanation of why this agent was selected"
    }
    `;
    
    try {
      // Ask the LLM to select the appropriate agent
      const response = await this.llm.invoke([
        new HumanMessage(prompt)
      ]);

      // Parse the response to get the selected agent
      let selection;
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      try {
        // Try to extract JSON from the content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/);
                          
        if (jsonMatch) {
          selection = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (error: any) {
        console.error("Error parsing agent selection:", error);
        throw new Error("Failed to parse agent selection");
      }
      
      if (!selection) {
        throw new Error("Failed to determine the appropriate agent for this query");
      }

      console.log(`Selected agent: ${selection.agentName}`);
      
      // Find the selected agent
      const selectedAgent = this.agents.find(a => a.name === selection.agentName);
      
      if (!selectedAgent) {
        throw new Error(`Agent ${selection.agentName} not found`);
      }

      // Execute the appropriate method based on the agent type
      if (selection.agentName === "CopyTraderDetectorAgent") {
        return await selectedAgent.instance.processQuery(userInput);
      }
      
      throw new Error(`No execution method defined for ${selection.agentName}`);
    } catch (error: any) {
      console.error("Error processing query:", error);
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }
} 