import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { 
  createCopyTraderDetectorAgent, 
  COPY_TRADER_DETECTOR_DESCRIPTION,
} from "./agents/CopyTraderDetectorAgent";
import { 
  createENSWalletIdentifierAgent, 
  ENS_WALLET_IDENTIFIER_DESCRIPTION,
} from "./agents/ENSWalletIdentifierAgent";
import { 
  createSideWalletsFinderAgent, 
  SIDE_WALLETS_FINDER_DESCRIPTION,
} from "./agents/SideWalletsFinderAgent";
import {
  createHistoricalEnsDomainsFinderAgent,
  HISTORICAL_ENS_DOMAINS_FINDER_DESCRIPTION,
} from "./agents/HistoricalEnsDomainsFinderAgent";
import {
  createEarlyTokenBuyersFinderAgent,
  EARLY_TOKEN_BUYERS_FINDER_DESCRIPTION,
} from "./agents/EarlyTokenBuyersFinderAgent";
import { createTokenResolverAgent, TOKEN_RESOLVER_DESCRIPTION } from "./agents/TokenResolverAgent";
import {
  createOnchainKitAgent,
  ONCHAIN_KIT_AGENT_DESCRIPTION,
} from "./agents/OnchainKitAgent";
import {
  createHederaAgent,
  HEDERA_AGENT_KIT_DESCRIPTION,
} from "./agents/HederaAgent";
import { getChatAPI, getReasoningChatAPI } from "./llms/ChatAPI";


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
  private planningLLM;
  private executionLLM;
  private agents: AgentInfo[] = [];

  constructor() {
    // Check for required API keys
    const oraAPIKey = process.env.ORA_API_KEY;
    if (!oraAPIKey) {
      throw new Error("ORA_API_KEY environment variable is required");
    }

    // Initialize planning and execution LLMs using the shared API
    this.planningLLM = getReasoningChatAPI();
    this.executionLLM = getChatAPI();

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
      },
      {
        name: "HistoricalEnsDomainFinderAgent",
        description: HISTORICAL_ENS_DOMAINS_FINDER_DESCRIPTION,
        instance: createHistoricalEnsDomainsFinderAgent(),
      },
      {
        name: "EarlyTokenBuyersFinderAgent",
        description: EARLY_TOKEN_BUYERS_FINDER_DESCRIPTION,
        instance: createEarlyTokenBuyersFinderAgent(),
      },
      {
        name: "TokenResolverAgent",
        description: TOKEN_RESOLVER_DESCRIPTION,
        instance: createTokenResolverAgent(),
      },
      {
        name: "OnchainKitAgent",
        description: ONCHAIN_KIT_AGENT_DESCRIPTION,
        instance: createOnchainKitAgent(),
      },
      {
        name: "HederaAgent",
        description: HEDERA_AGENT_KIT_DESCRIPTION,
        instance: createHederaAgent(),
      }
    ];
  }

  /**
   * Process a user query and route to the appropriate agent(s) using LangGraph Supervisor
   */
  async processQuery(userInput: string): Promise<any> {
    console.log(`Processing user query: "${userInput}"`);
    
    // Create agent descriptions for the prompt
    const agentDescriptions = this.agents
      .map(agent => `- ${agent.name}: ${agent.description}`)
      .join('\n');

    // Create the prompt for planning
    const planningPrompt = `
    You are an expert blockchain analysis supervisor. Your task is to analyze the user query and create a plan for how to process it using the available specialized agents.

    Available agents:
    ${agentDescriptions}

    IMPORTANT: Some agents can handle arrays of data in a single call, while others can only process one input at a time. For agents that can only handle single inputs, you'll need to plan for multiple sequential calls if there are multiple inputs to process.

    Based on the user query, create a plan for how to process it. The plan should include:
    1. Which agent(s) should be used
    2. In what order they should be used
    3. Whether each agent needs multiple calls for multiple inputs
    4. How their results should be combined

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

      Important note about agent capabilities:
      - Some agents can handle arrays of data in a single invocation
      - Other agents can only process one data point at a time
      - When multiple data points need to be processed by an agent that handles one at a time,
        the planner will include multiple steps with the same agent name
      - Follow the plan exactly - if an agent appears multiple times, invoke it separately for each step

      Follow these guidelines:
      - Execute agents in series when their outputs depend on each other 
      - Execute agents in parallel when their tasks are independent
      - Combine the results according to the final_analysis instructions in the plan
      - Maintain clear traceability of which agent produced which findings
      - Format the final response in a clear, structured way

      When agents execute in series you MUST inject the results of the previous agent as context for the next agent.

      OUTPUT FORMAT:
      You MUST return your response as a JSON object with the following structure:
      {
        "message": string, // A human-readable summary synthesizing all agent findings
        "aggregatedAgentsData": object[] // An array containing the raw JSON responses from each agent executed
      }

      Return ONLY this JSON structure, properly formatted, with no additional text or explanation.
      `;

      // Create the supervisor with the plan and agents
      const supervisor = await createSupervisor({
        llm: this.executionLLM,
        agents,
        prompt: supervisorPrompt,
      });

      const app = supervisor.compile();
      
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
      console.log('FINAL MESSAGE', lastMessage);
      return lastMessage.content;
    } catch (error: any) {
      console.error("Error processing query:", error);
      
      // Fallback to the old method if the supervisor approach fails
      console.log("Falling back to direct agent selection...");
    }
  }
}