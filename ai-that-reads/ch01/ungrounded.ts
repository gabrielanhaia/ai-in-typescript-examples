// ch01/ungrounded.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-sonnet-5",
  maxTokens: 400,
});

const reply = await model.invoke([
  new SystemMessage(
    "You are a support assistant for Braxby Cycles, an online retailer " +
      "of bicycle parts. You help customers with orders and policies.",
  ),
  new HumanMessage(
    "How long is the warranty on a Braxby carbon frame, and does it " +
      "still apply if I sell the bike to someone else?",
  ),
]);

console.log(reply.text);
