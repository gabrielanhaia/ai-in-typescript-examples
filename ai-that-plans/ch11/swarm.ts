// ch11/swarm.ts
import { createSwarm } from "@langchain/langgraph-swarm";
import { MemorySaver } from "@langchain/langgraph";
import { build } from "./specialists.js";
import { peersOf } from "./handoffs.js";

export const swarmed = createSwarm({
  // This comment is not in the book, and it changes no printed line. The
  // pinned @langchain/langgraph-swarm@1.0.2 declares `agents` in terms of
  // the graph `createReactAgent` returns, not the one `createAgent`
  // returns; the supervisor package widened its union for exactly this
  // case and the swarm package has not. The value passed below is a real
  // CompiledStateGraph and the run is fine — only the declaration
  // disagrees. When the pin moves, tsc will report the suppression as
  // unused: delete it then. See ch11/README.md.
  // @ts-expect-error package types lag `createAgent`; see the note above
  agents: build(peersOf).map((a) => a.graph),
  defaultActiveAgent: "orders",
}).compile({ checkpointer: new MemorySaver() });
