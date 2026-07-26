// PRINTED IN CHAPTER 10 as `ch10/observe.ts`.
//
// The transcript printer from chapter 4, ported to the framework's message
// classes. Same three columns: the name, the arguments, the result.
import { isAIMessage, isToolMessage } from "@langchain/core/messages";
import { agentFor } from "./agent.js";

const agent = agentFor(AbortSignal.timeout(60_000));

for await (const [message] of await agent.stream(
  { messages: [{ role: "user", content: "Where is order ORD-4471?" }] },
  { streamMode: "messages" },
)) {
  if (isAIMessage(message)) {
    for (const call of message.tool_calls ?? []) {
      console.log(`-> ${call.name} ${JSON.stringify(call.args)}`);
    }
  }
  if (isToolMessage(message)) {
    const text = String(message.content).slice(0, 60);
    console.log(`<- ${message.name} ${text}`);
  }
}
