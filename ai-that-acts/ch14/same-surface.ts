// PRINTED IN CHAPTER 14 as `ch14/same-surface.ts`.
//
// The imports and the fixed reply are not printed. No traffic leaves the
// host: the response is a constant a few lines below, and the string standing
// in for a key is the word `unused`.
import { createServer } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
import { definitions } from "../ch03/toolbox.js";
import { SYSTEM } from "../ch04/system.js";
import { TOOLS } from "../ch10/tools.js";
import { MAX_TOKENS, MODEL } from "./config.js";

const seen: Record<string, unknown>[] = [];
const CANNED = {
  id: "msg_local",
  type: "message",
  role: "assistant",
  model: MODEL,
  content: [{ type: "text", text: "ok" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
};

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    seen.push(JSON.parse(body));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(CANNED));
  });
});
await new Promise<void>((up) => server.listen(0, "127.0.0.1", up));
const { port } = server.address() as { port: number };
const baseURL = `http://127.0.0.1:${port}`;
const ASK = [{ role: "user" as const, content: "Where is ORD-4471?" }];

// Chapter 4's request, assembled by hand.
await new Anthropic({ apiKey: "unused", baseURL }).messages.create({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  system: SYSTEM,
  tools: definitions,
  messages: ASK,
});
const hand = seen.pop()!;

// Chapter 10's request, assembled by createAgent.
await createAgent({
  model: new ChatAnthropic({
    model: MODEL,
    maxTokens: MAX_TOKENS,
    apiKey: "unused",
    anthropicApiUrl: baseURL,
  }),
  tools: TOOLS,
  systemPrompt: SYSTEM,
}).invoke({ messages: ASK });
const framework = seen.pop()!;
server.close();

const wire = (value: unknown) => JSON.stringify(value) ?? "(absent)";
for (const field of ["model", "max_tokens", "messages", "tools"]) {
  const same = wire(hand[field]) === wire(framework[field]);
  console.log(`${field.padEnd(11)} ${same ? "same" : "DIFFERENT"}`);
}
console.log(`system      ${wire(hand.system).slice(0, 24)}…`);
console.log(`            ${wire(framework.system).slice(0, 24)}…`);
const streams = `${wire(hand.stream)} / ${wire(framework.stream)}`;
console.log(`stream      ${streams}`);
