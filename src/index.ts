import 'dotenv/config';
import { HumanMessage } from "@langchain/core/messages";
import { createJokeAgent } from './agents/jokeAgent';

async function main() {
  const agent = createJokeAgent();

  // Get the first joke
  const agentFinalState = await agent.invoke(
    { messages: [new HumanMessage("Tell me a short joke")] },
    { configurable: { thread_id: "41" } },
  );

  console.log(
    agentFinalState.messages[agentFinalState.messages.length - 1].content,
  );

  // Get another joke using the same agent (with memory)
  const agentNextState = await agent.invoke(
    { messages: [new HumanMessage("Tell me another one")] },
    { configurable: { thread_id: "42" } },
  );

  console.log(
    agentNextState.messages[agentNextState.messages.length - 1].content,
  );
}

main().catch(console.error); 