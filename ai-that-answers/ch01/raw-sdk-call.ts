import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const message = await client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 300,
  system: "Answer in one short paragraph. No lists.",
  messages: [{ role: "user", content: "What is a monorepo?" }],
});

console.log(message.content);
