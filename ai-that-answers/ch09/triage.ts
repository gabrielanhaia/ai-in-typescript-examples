import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import { Triage } from "./schema.js";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 1024,
});

const ticket =
  process.argv.slice(2).join(" ") ||
  "I was charged twice for the October invoice and the export button on the reports page does nothing.";

const triager = model.withStructuredOutput(Triage, {
  name: "triage",
});

const result = await triager.invoke([
  new SystemMessage("You triage inbound support messages."),
  new HumanMessage(ticket),
]);

console.log(result.category);   // typed as the enum
console.log(result.urgency);    // typed as the enum
console.log(result.summary);
console.log(result.productArea);
