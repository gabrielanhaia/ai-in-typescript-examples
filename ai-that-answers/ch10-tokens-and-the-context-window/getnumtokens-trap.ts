// The trap, kept runnable so you can watch it happen. getNumTokens falls
// through to core, which asks js-tiktoken for an encoding named
// "claude-haiku-4-5", gets Error: Unknown model, warns on stderr and silently
// returns Math.ceil(text.length / 4). A silent wrong answer.
import { ChatAnthropic } from "@langchain/anthropic";
import { countTokens } from "./count.js";
import { HumanMessage } from "langchain";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 16,
});

const text = "some text you want to measure";

// Do not do this.
const n = await model.getNumTokens(text);

console.log("getNumTokens     ", n, "(text.length / 4, rounded up)");
console.log("countTokens      ", await countTokens([new HumanMessage(text)]));
