// The block printed in chapter 2 under "What the definitions cost". The
// chapter prints it without a filename, because it is two lines added to the
// listing above; it is a file here so you can run it with and without the
// `tools` line and read the difference.
import Anthropic from "@anthropic-ai/sdk";
import { getOrderStatus } from "./tool.js";

const client = new Anthropic();

const count = await client.messages.countTokens({
  model: "claude-sonnet-5",
  tools: [getOrderStatus],
  messages: [{ role: "user", content: "Where is order ORD-4471?" }],
});
console.log(count.input_tokens);

// The same request with no tool on it. The difference is what the definition
// costs, on every request of every step.
const bare = await client.messages.countTokens({
  model: "claude-sonnet-5",
  messages: [{ role: "user", content: "Where is order ORD-4471?" }],
});
console.log(bare.input_tokens);
