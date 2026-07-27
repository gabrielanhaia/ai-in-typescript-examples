// ch02/watch.ts
import { HumanMessage } from "@langchain/core/messages";
import { assistant } from "./graph.js";

const ticks = await assistant.stream(
  { messages: [new HumanMessage("The rear hub is grinding.")] },
  { streamMode: "updates" },
);

// One line per superstep: which node ran, and what it wrote.
for await (const tick of ticks) {
  for (const [node, update] of Object.entries(tick)) {
    const wrote = Object.keys(update as object).join(", ");
    console.log(`${node} wrote ${wrote}`);
  }
}
