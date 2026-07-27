// ch11/handoffs.ts
import { createHandoffTool } from "@langchain/langgraph-swarm";
import { SPECIALISTS } from "./specialists.js";

const NAMES = SPECIALISTS.map((s) => s.name);

/** Every specialist gets one transfer tool per peer. The model
 *  sees `transfer_to_<name>`; the package derives that string
 *  from `agentName`, so it must equal the node name exactly. */
export function peersOf(self: string) {
  return NAMES.filter((n) => n !== self).map((n) =>
    createHandoffTool({
      agentName: n,
      description:
        `Transfer the whole job to ${n} and stop working. ` +
        `Say in your last message what you established.`,
    }),
  );
}
