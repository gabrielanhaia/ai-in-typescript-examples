// ch04/command-graph.ts
import { StateGraph, START, END, Command } from "@langchain/langgraph";
import { PlanState, type State } from "./state.js";
import { decide, type Route } from "./route.js";
import { runStep } from "./tools.js";
import { plan } from "./plan.js";
import { advance, notify } from "./nodes.js";

const NEXT: Record<Route, string> = {
  retry: "execute",
  continue: "advance",
  finish: "notify",
};

async function execute(state: State) {
  const step = state.steps[state.cursor];
  const result = await runStep(step, state.cursor);
  const attempts = state.attempts + 1;
  const lastError = result.ok ? "" : result.error;
  return new Command({
    update: result.ok
      ? { attempts, lastError, completed: step }
      : { attempts, lastError },
    goto: NEXT[decide({ ...state, attempts, lastError })],
  });
}

export const commandGraph = new StateGraph(PlanState)
  .addNode("plan", plan)
  .addNode("execute", execute, {
    ends: ["execute", "advance", "notify"],
  })
  .addNode("advance", advance)
  .addNode("notify", notify)
  .addEdge(START, "plan")
  .addEdge("plan", "execute")
  .addEdge("advance", "execute")
  .addEdge("notify", END)
  .compile();
