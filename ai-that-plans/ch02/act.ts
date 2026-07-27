// ch02/act.ts
import { AIMessage } from "@langchain/core/messages";
import type { State, Update } from "./state.js";
import { runStep } from "./tools.js";

export async function act(state: State): Promise<Update> {
  const [first] = state.steps;
  if (first === undefined) {
    return { messages: new AIMessage("The planner returned no steps.") };
  }
  const result = await runStep(first);
  return { messages: new AIMessage(`${first} -> ${result}`) };
}
