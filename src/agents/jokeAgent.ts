import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

export function createJokeAgent() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Please set the OPENAI_API_KEY in your .env file");
  }

  const agentModel = new ChatOpenAI({ temperature: 0 });

  // Initialize memory to persist state between graph runs
  const agentCheckpointer = new MemorySaver();
  const agent = createReactAgent({
    llm: agentModel,
    tools: [],
    checkpointSaver: agentCheckpointer,
  });

  return agent;
}