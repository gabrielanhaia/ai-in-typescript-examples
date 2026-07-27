// ch02/run.ts
import { HumanMessage } from "@langchain/core/messages";
import { assistant } from "./graph.js";

const REQUEST =
  "My Verano hybrid is under warranty and the rear hub is " +
  "grinding. Can you sort it?";

const final = await assistant.invoke({
  messages: [new HumanMessage(REQUEST)],
});

for (const step of final.steps) console.log(`plan  ${step}`);
console.log(`msgs  ${final.messages.length}`);
console.log(`last  ${final.messages.at(-1)?.text ?? ""}`);
