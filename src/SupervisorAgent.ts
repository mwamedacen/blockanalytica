import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { 
  createCopyTraderDetectorAgent, 
  COPY_TRADER_DETECTOR_DESCRIPTION,
} from "./agents/CopyTraderDetectorAgent.ts";
import { 
  createENSWalletIdentifierAgent, 
  ENS_WALLET_IDENTIFIER_DESCRIPTION,
} from "./agents/ENSWalletIdentifierAgent.ts";
import { 
  createSideWalletsFinderAgent, 
  SIDE_WALLETS_FINDER_DESCRIPTION,
} from "./agents/SideWalletsFinderAgent.ts";


// Define the plan step interface
interface PlanStep {
  agent: string;
  reason: string;
}

// Simple agent info interface
interface AgentInfo {
  name: string;
  description: string;
  instance: any;
}

export class SupervisorAgent {
  private planningLLM: ChatOllama;
  private executionLLM: ChatOpenAI;
  private agents: AgentInfo[] = [];

  constructor() {
    // Check for required API keys
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // Initialize planning LLM (Ollama with deepseek-r1:14b)
    this.planningLLM = new ChatOllama({
      baseUrl: "http://127.0.0.1:11434",
      model: "deepseek-r1:14b",
      temperature: 0,
    });

    // Initialize execution LLM for the supervisor
    this.executionLLM = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey,
    });

    // Initialize all available agents
    this.agents = [
      {
        name: "CopyTraderDetectorAgent",
        description: COPY_TRADER_DETECTOR_DESCRIPTION,
        instance: createCopyTraderDetectorAgent(),
      },
      {
        name: "ENSWalletIdentifierAgent",
        description: ENS_WALLET_IDENTIFIER_DESCRIPTION,
        instance: createENSWalletIdentifierAgent(),
      },
      {
        name: "SideWalletsFinderAgent",
        description: SIDE_WALLETS_FINDER_DESCRIPTION,
        instance: createSideWalletsFinderAgent(),
      }
    ];
  }

  /**
   * Process a user query and route to the appropriate agent(s) using LangGraph Supervisor
   */
  async processQuery(userInput: string): Promise<any> {
    console.log(`Processing user query: "${userInput}"`);

    // Create the prompt for planning
    const planningPrompt = `
    You are an expert blockchain analysis supervisor. Your task is to analyze the user query and create a plan for how to process it using the available specialized agents.

    Available agents:
    ${this.agents
      .map(agent => `- ${agent.name}: ${agent.description}`)
      .join('\n')}

    Based on the user query, create a plan for how to process it. The plan should include:
    1. Which agent(s) should be used
    2. In what order they should be used
    3. How their results should be combined

    Respond in the following JSON format only:
    {
      "plan": [
        {
          "agent": "Name of the agent to use",
          "reason": "Why this agent should be used"
        }
      ],
      "final_analysis": "How to combine the results of the agents"
    }
    `;
    
    try {
      // Ask the planning LLM to create a plan
      const planResponse = await this.planningLLM.invoke([
        new SystemMessage(planningPrompt),
        new HumanMessage(userInput)
      ]);

      // Parse the response to get the plan
      let plan: { plan: PlanStep[], final_analysis: string };
      const content = typeof planResponse.content === 'string' 
        ? planResponse.content 
        : JSON.stringify(planResponse.content);
      
      try {
        // Try to extract JSON from the content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/);
                          
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (error: any) {
        console.error("Error parsing plan:", error);
        throw new Error("Failed to parse plan");
      }
      
      if (!plan) {
        throw new Error("Failed to create a plan for processing the query");
      }

      console.log("Plan created:", JSON.stringify(plan, null, 2));
      
      // Create a map of agent names to their instances
      const agents = this.agents.map(agent => agent.instance)
      
      const supervisorPrompt = `
      You are a blockchain analysis supervisor agent responsible for orchestrating multiple specialized agents to analyze blockchain data.

      Your task is to execute the following plan by invoking the appropriate agents in the specified order:
      ${JSON.stringify(plan, null, 2)}

      For each step in the plan:
      1. Invoke the specified agent with the user's query
      2. Collect and store the agent's response
      3. Use the response as context for subsequent agent invocations if needed

      Follow these guidelines:
      - Execute agents in series when their outputs depend on each other
      - Execute agents in parallel when their tasks are independent
      - Combine the results according to the final_analysis instructions in the plan
      - Maintain clear traceability of which agent produced which findings
      - Format the final response in a clear, structured way

      Return a comprehensive analysis that synthesizes all agent findings according to the plan's final_analysis directive.
      `;

      // Create the supervisor with the plan and agents
      const supervisor = await createSupervisor({
        llm: this.executionLLM,
        agents,
        prompt: supervisorPrompt,
      });

      const app = supervisor.compile({name: 'MainSupervisorAgent'});
      
      // Execute the plan using the supervisor
      // Note: We're using the supervisor's invoke method directly
      const result = await app.invoke({
        messages: [new HumanMessage(userInput)],
      }, {
        configurable: {
          thread_id : Math.random()
        }
      });
      
      const lastMessage = result.messages[result.messages.length - 1];
      console.log('FINAL MESSAGE', lastMessage)
      return lastMessage.content;
    } catch (error: any) {
      console.error("Error processing query:", error);
    }
  }

} 