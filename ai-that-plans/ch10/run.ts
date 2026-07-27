// NOT A LISTING FROM THE BOOK.
//
// The chapter default, and the thing every other listing here reads. The
// chapter prints its output twice:
//
//     $ npm run run-example -- ch10/run job-4817
//     Your HUB-DX-135 is dispatched. We have you in on Tue 09:00.
//
// One thread id per run, so `ch10/patch` can correct 4817 in place while
// `ch10/fork` branches 4818 and leaves it standing.
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { buildGraph } from "./graph.js";

const threadId = process.argv[2] ?? "job-4817";
const graph = buildGraph(SqliteSaver.fromConnString("./ch10.sqlite"));

const state = await graph.invoke(
  { request: "Verano hybrid, rear hub grinding, under warranty" },
  { configurable: { thread_id: threadId } },
);

console.log(state.message);
