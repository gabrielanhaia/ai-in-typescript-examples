// PRINTED IN CHAPTER 10 as `ch10/run.ts`.
//
// The same history, relabelled. `human` corresponds to the `user` role, and
// each `tool_result` block has been lifted out of its user message and given
// a message to itself.
import { agentFor } from "./agent.js";

const agent = agentFor(AbortSignal.timeout(60_000));

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Order ORD-4471 arrived damaged — what are my options?",
    },
  ],
});

for (const message of result.messages) {
  const kind = message.getType().padEnd(9);
  console.log(`${kind} ${message.text.slice(0, 70)}`);
}
