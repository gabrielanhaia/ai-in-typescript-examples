// NOT A LISTING FROM THE BOOK.
//
// The chapter's first exercise — "run the same thread id twice on `memory`,
// then on `sqlite`" — made runnable with no API key and no container, so the
// one claim this chapter is built on can be seen on a clean clone.
//
// The only thing swapped out is the planner: `ch06/graph.ts` asks the model
// for the plan, and a fixed plan changes nothing about where the checkpoints
// go, which is the part being demonstrated. Everything else is the chapter's:
// the same `JobState`, the same two nodes, the same `openCheckpointer`.
//
// The thread id carries this process's pid, so run 1 is always a new thread
// and run 2 is always a resume, however many times you run the file.
import { END, START, StateGraph } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { JobState } from "./state.js";
import { closeCheckpointer, openCheckpointer } from "./checkpointer.js";
import { TOOLS, runTool } from "./shop.js";

/** ch06/graph.ts, with the planner replaced by the plan it would return. */
function buildGraph(checkpointer: BaseCheckpointSaver) {
  return new StateGraph(JobState)
    .addNode("plan", async () => ({ steps: [...TOOLS] }))
    .addNode("work", async (s) => ({
      done: await runTool(s.steps[s.done.length]),
    }))
    .addEdge(START, "plan")
    .addEdge("plan", "work")
    .addConditionalEdges("work", (s) =>
      s.done.length < s.steps.length ? "work" : END,
    )
    .compile({ checkpointer });
}

const threadId = `job-${process.pid}`;
const config = { configurable: { thread_id: threadId } };

/** One run, with a checkpointer built fresh — as a new process would. */
async function once(kind: "memory" | "sqlite", label: string) {
  const checkpointer = openCheckpointer(kind);
  const graph = buildGraph(checkpointer);

  const prior = await graph.getState(config);
  const resumed = prior.createdAt !== undefined;
  const input = resumed
    ? null
    : {
        messages: [
          {
            role: "user" as const,
            content: "My rear hub is grinding. Can you sort it?",
          },
        ],
      };

  const final = await graph.invoke(input, config);
  console.log(
    `${kind.padEnd(7)} ${label}  ${
      resumed ? "resumed a thread it had seen" : "started from nothing        "
    }  ${final.done.length} steps done`,
  );
  await closeCheckpointer(checkpointer);
}

console.log(`thread ${threadId}\n`);

// Two MemorySavers, one after the other. The second one has never heard of
// this thread, which is what a second process looks like.
await once("memory", "run 1");
await once("memory", "run 2");

// Two SqliteSavers over the same file. The second one has.
await once("sqlite", "run 1");
await once("sqlite", "run 2");

console.log(
  "\nmemory forgot between runs, sqlite did not. The file is at\n" +
    "data/braxby.sqlite — sqlite3 data/braxby.sqlite " +
    '"select count(*) from checkpoints"',
);
