// NOT A LISTING FROM THE BOOK.
//
// The chapter names this file and does not print it:
//
//   "`ch11/compare.ts` imports the three graphs and calls `measure` on each
//    with its own `thread_id`. Run it with `npm run run-example -- ch11/compare`.
//    Three rows come out, one per topology, each carrying the topology's name
//    and then five numbers: the message count, the input and output tokens,
//    the cache reads, and the wall clock."
//
// That is all it does. Three calls to `measure`, three rows, in the order the
// prose reads them: the single agent is the baseline, and both team rows are
// read against it rather than against each other.
//
// Needs ANTHROPIC_API_KEY — every row here is a real run of a real team.
import { measure } from "./measure.js";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is not set. This example runs three teams against " +
      "the model — set the key in ../.env or the environment and run it " +
      "again.",
  );
  process.exit(1);
}

// Deferred on purpose. A static import is hoisted above the check above, and
// every one of these modules constructs a ChatAnthropic at module scope — so
// importing them up top would throw the SDK's own error first.
const { single } = await import("./single.js");
const { supervised } = await import("./supervisor.js");
const { swarmed } = await import("./swarm.js");

const TOPOLOGIES = [
  { name: "single", graph: single, thread: "cmp-single" },
  { name: "supervisor", graph: supervised, thread: "cmp-supervisor" },
  { name: "swarm", graph: swarmed, thread: "cmp-swarm" },
];

const column = (text: string) => text.padStart(10);
const n = (value: number) => column(value.toLocaleString("en-GB"));

console.log(
  "topology".padEnd(11) +
    column("messages") +
    column("input") +
    column("output") +
    column("cacheRead") +
    column("ms"),
);

for (const { name, graph, thread } of TOPOLOGIES) {
  const cost = await measure(graph, thread);
  console.log(
    name.padEnd(11) +
      n(cost.messages) +
      n(cost.input) +
      n(cost.output) +
      n(cost.cacheRead) +
      n(cost.ms),
  );
}
