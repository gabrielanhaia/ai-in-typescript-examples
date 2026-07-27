// ch09/first-stream.ts
import { assistant } from "./graph.js";

const request =
  "My Verano hybrid is under warranty and the rear hub is " +
  "grinding. Can you sort it?";

const stream = await assistant.stream(
  { messages: [{ role: "user", content: request }] },
  {
    configurable: { thread_id: "braxby-verano-1" },
    streamMode: "updates",
  },
);

for await (const chunk of stream) {
  for (const [node, update] of Object.entries(chunk)) {
    console.log(node, JSON.stringify(update));
  }
}
