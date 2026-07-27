// ch09/measure.ts
import { assistant } from "./graph.js";
import type { StreamMode } from "@langchain/langgraph";

const MODES: StreamMode[] = [
  "values",
  "updates",
  "checkpoints",
  "tasks",
];

const request = "The rear hub on my Verano is grinding.";

for (const mode of MODES) {
  let events = 0;
  let bytes = 0;
  // A fresh thread per mode: the same work, measured four times.
  const stream = await assistant.stream(
    { messages: [{ role: "user", content: request }] },
    {
      configurable: { thread_id: `measure-${mode}` },
      streamMode: mode,
    },
  );
  for await (const chunk of stream) {
    events += 1;
    bytes += JSON.stringify(chunk).length;
  }
  console.log(mode, events, bytes, bytes / Math.max(events, 1));
}
