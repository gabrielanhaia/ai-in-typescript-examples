import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "langchain";
import type { Check } from "./checks.js";

export interface Variant {
  name: string;
  system: string;
}

export interface Tally {
  variant: string;
  runs: number;
  passes: Record<string, number>;
}

const model = new ChatAnthropic({
  model: "claude-haiku-4-5",
  maxTokens: 256,
  temperature: 0,
});

async function runOnce(system: string, input: string): Promise<string> {
  const reply = await model.invoke([
    new SystemMessage(system),
    new HumanMessage(input),
  ]);
  return reply.text.trim();
}

export async function score(
  variant: Variant,
  inputs: readonly string[],
  checks: readonly Check[],
  runsPerInput: number,
): Promise<Tally> {
  const passes: Record<string, number> = {};
  for (const check of checks) {
    passes[check.name] = 0;
  }

  let runs = 0;
  for (const input of inputs) {
    for (let i = 0; i < runsPerInput; i += 1) {
      const output = await runOnce(variant.system, input);
      runs += 1;
      for (const check of checks) {
        if (check.passes(output, input)) {
          passes[check.name] = (passes[check.name] ?? 0) + 1;
        }
      }
    }
  }

  return { variant: variant.name, runs, passes };
}
