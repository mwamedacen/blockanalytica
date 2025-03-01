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
import {
  createEVMBlockchainAgent,
  EVM_BLOCKCHAIN_AGENT_KIT_DESCRIPTION,
} from "./agents/EVMBlockchainAgent";
import { getChatAPI } from "./llms/ChatAPI";
import { AuthTokenClaims } from "@privy-io/server-auth";
import { getUserWallet } from "./utils/blockchainAgent";
import { base } from "viem/chains";
import { BaseWallet, Wallet } from "ethers";

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
    this.planningLLM = getChatAPI();
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

  async processQueryWithUser(userInput: string, claims: AuthTokenClaims): Promise<any> {

    const wallet = await getUserWallet(claims.userId);

    this.agents.push({
      name: "EVMBlockchainAgent",
      description: EVM_BLOCKCHAIN_AGENT_KIT_DESCRIPTION,
      instance: createEVMBlockchainAgent(wallet, base),
    });

    const plan = await this.makePlan(userInput);

    // if plan cointains EVMBlockchainAgent, then will route user to new mode for EVM blockchain agent
    if (plan.plan.some(step => step.agent === "EVMBlockchainAgent")) {
      return this.processEVMBlockchainAgent(userInput, plan, wallet);
    }

    return this.processQuery(userInput);
  }

  private async processEVMBlockchainAgent(userInput: string, plan: {
    plan: PlanStep[];
    final_analysis: string;
  }, wallet: BaseWallet): Promise<any> {

    const agent = this.agents.find(a => a.name === "EVMBlockchainAgent");
    return this.executePlanWithAgents(userInput, plan, [agent?.instance]);
  }

  /**
   * Creates a plan for processing a user query using available agents
   * @param userInput The user's query
   * @returns A plan object with steps and final analysis
   */
  private async makePlan(userInput: string): Promise<{ plan: PlanStep[], final_analysis: string }> {
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
    
    // Ask the planning LLM to create a plan
    const planResponse = await this.planningLLM.invoke([
      new SystemMessage(planningPrompt),
      new HumanMessage(userInput)
    ]);

    // Parse the response to get the plan
    const content = typeof planResponse.content === 'string' 
      ? planResponse.content 
      : JSON.stringify(planResponse.content);
    
    try {
      // Try to extract JSON from the content
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
                        
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (error: any) {
      console.error("Error parsing plan:", error);
      throw new Error("Failed to parse plan");
    }
  }

  /**
   * Process a user query and route to the appropriate agent(s) using LangGraph Supervisor
   */
  async processQuery(userInput: string): Promise<any> {
    console.log(`Processing user query: "${userInput}"`);
    
    try {
      // Get the plan from the makePlan function
      const plan = await this.makePlan(userInput);
      
      if (!plan) {
        throw new Error("Failed to create a plan for processing the query");
      }

      console.log("Plan created:", JSON.stringify(plan, null, 2));
      
      // Get only the agents specified in the plan
      const agentsToUse = this.getAgentsFromPlan(plan);
      
      // Execute the plan with the selected agents
      return await this.executePlanWithAgents(userInput, plan, agentsToUse);
    } catch (error: any) {
      console.error("Error processing query:", error);
      
      // Fallback to the old method if the supervisor approach fails
      console.log("Falling back to direct agent selection...");
      throw error; // Re-throw the error or implement a fallback mechanism
    }
  }

  /**
   * Get only the agents specified in the plan
   * @param plan The execution plan
   * @returns Array of agent instances to be used
   */
  private getAgentsFromPlan(plan: { plan: PlanStep[], final_analysis: string }): any[] {
    // Extract unique agent names from the plan
    const agentNames = [...new Set(plan.plan.map(step => step.agent))];
    
    // Find the corresponding agent instances
    const agentsToUse = agentNames.map(name => {
      const agent = this.agents.find(a => a.name === name);
      if (!agent) {
        throw new Error(`Agent ${name} specified in plan but not found in available agents`);
      }
      return agent.instance;
    });

    return agentsToUse;
  }

  /**
   * Execute the plan with the specified agents using LangGraph Supervisor
   * @param userInput The user's query
   * @param plan The execution plan
   * @param agents Array of agent instances to use
   * @returns The result of the execution
   */
  private async executePlanWithAgents(
    userInput: string, 
    plan: { plan: PlanStep[], final_analysis: string },
    agents: any[]
  ): Promise<any> {
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
  }
}