import { expect, test } from "vitest";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "langchain";

test("the configured model accepts our sampling settings", async () => {
  const chat = new ChatAnthropic({
    model: process.env.MODEL_ID ?? "claude-haiku-4-5",
    maxTokens: 16,
    temperature: 0,
  });
  const reply = await chat.invoke([new HumanMessage("Say OK.")]);
  expect(reply.text.length).toBeGreaterThan(0);
});
