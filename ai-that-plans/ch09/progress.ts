// ch09/progress.ts
import { StateGraph } from "@langchain/langgraph";
import { PlanState } from "./state.js";
import { searchSupplier, SUPPLIERS } from "./suppliers.js";

// Declared inline on the builder so the second argument is typed
// as the node runtime, which is where `writer` lives.
export const withFindParts = new StateGraph(PlanState).addNode(
  "find_parts",
  async (state, runtime) => {
    runtime.writer({ node: "find_parts", phase: "start" });

    const found: string[] = [];
    for (const supplier of SUPPLIERS) {
      runtime.writer({ node: "find_parts", supplier });
      found.push(...(await searchSupplier(supplier)));
    }

    runtime.writer({ node: "find_parts", phase: "done" });
    return {
      results: { find_parts: found.join(", ") },
      cursor: state.cursor + 1,
    };
  },
);
