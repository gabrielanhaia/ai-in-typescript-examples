// The deadlines, in use. A stream fails by going quiet, not by taking long, so
// it needs two of them: one for the first token, one for the gap between tokens.
import { HumanMessage, SystemMessage } from "langchain";
import { withDeadlines } from "./deadlines.js";
import { model } from "./chosen-policy.js";
import { INTERACTIVE } from "./policy.js";
import { finishOf } from "./finish.js";
import type { AIMessageChunk } from "@langchain/core/messages";

const messages = [
  new SystemMessage("Explain plainly. No lists."),
  new HumanMessage("Why is HTTP/2 faster than HTTP/1.1?"),
];

const stream = withDeadlines(
  (signal) => model.stream(messages, { signal }),
  { firstTokenMs: INTERACTIVE.firstTokenMs, idleMs: INTERACTIVE.idleMs },
);

let final: AIMessageChunk | undefined;

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
  final = final === undefined ? chunk : final.concat(chunk);
}

process.stdout.write("\n");

if (final !== undefined) {
  console.log(finishOf(final).kind);
}
