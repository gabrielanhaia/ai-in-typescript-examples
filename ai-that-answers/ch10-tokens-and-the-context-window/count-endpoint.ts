// The counting endpoint, called directly. It takes the same shape as a request
// and returns only the input token count — no generation, and it is free.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const counted = await client.messages.countTokens({
  model: "claude-haiku-4-5",
  system: "You are a concise assistant.",
  messages: [{ role: "user", content: "What is a monorepo?" }],
});

console.log(counted.input_tokens);
