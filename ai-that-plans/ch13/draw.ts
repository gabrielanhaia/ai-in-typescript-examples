// ch13/draw.ts
import { buildGraph } from "./graph.js";
import { openCheckpointer } from "./checkpointer.js";

const graph = buildGraph(openCheckpointer());

// The async forms are the current ones; the synchronous getGraph
// and getSubgraphs are deprecated in the shipped types.
console.log((await graph.getGraphAsync({})).drawMermaid());

for await (const [name, sub] of graph.getSubgraphsAsync()) {
  console.log(`\n%% subgraph: ${name}`);
  console.log((await sub.getGraphAsync({})).drawMermaid());
}
