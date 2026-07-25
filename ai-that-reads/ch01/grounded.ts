// ch01/grounded.ts
import { readFile } from "node:fs/promises";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const CONTRACT = `You are a support assistant for Braxby Cycles.

Answer only from the sources given in the user message. If the sources
do not contain the answer, reply exactly: "I don't have that in the
documents I can see." Do not use any other knowledge about bicycles,
warranties, or Braxby Cycles.`;

const path = process.argv[2];
if (path === undefined) {
  throw new Error("usage: tsx ch01/grounded.ts <path-to-policy-file>");
}
const passage = await readFile(path, "utf8");

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 400,
});

const reply = await model.invoke([
  new SystemMessage(CONTRACT),
  new HumanMessage(
    `<source>\n${passage}\n</source>\n\n` +
      `How long is the warranty on a Braxby carbon frame, and does it ` +
      `still apply if I sell the bike to someone else?`,
  ),
]);

console.log(reply.text);
