// ch11/router.ts
import { StateGraph } from "@langchain/langgraph";
import {
  SwarmState,
  addActiveAgentRouter,
  getHandoffDestinations,
} from "@langchain/langgraph-swarm";
import { build } from "./specialists.js";
import { peersOf } from "./handoffs.js";

const agents = build(peersOf).map((a) => a.graph);
const names = agents.map((a) => a.name as string);

const builder = new StateGraph(SwarmState);
for (const agent of agents) {
  // `ends` is what makes a jump between siblings legal; the
  // package reads it back off the agent's own handoff tools
  // rather than making you restate the topology here.
  builder.addNode(agent.name as string, agent, {
    ends: getHandoffDestinations(agent),
    subgraphs: [agent],
  });
}

addActiveAgentRouter(builder, {
  routeTo: names,
  defaultActiveAgent: "orders",
});

export const routed = builder.compile();
