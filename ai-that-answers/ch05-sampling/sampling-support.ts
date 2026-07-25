import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "langchain";

const MODELS = ["claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5"];

async function probe(model: string): Promise<void> {
  try {
    const chat = new ChatAnthropic({
      model,
      maxTokens: 32,
      temperature: 0,
    });
    await chat.invoke([new HumanMessage("Say OK.")]);
    console.log(`${model}: temperature accepted`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(`${model}: rejected -> ${detail}`);
  }
}

for (const model of MODELS) {
  await probe(model);
}
