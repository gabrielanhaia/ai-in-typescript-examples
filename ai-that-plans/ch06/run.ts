// ch06/run.ts
import {
  closeCheckpointer,
  openCheckpointer,
  type Backend,
} from "./checkpointer.js";
import { buildGraph } from "./graph.js";

const kind = (process.env.CHECKPOINTS ?? "memory") as Backend;
const threadId = process.argv[2] ?? "job-1";

const checkpointer = openCheckpointer(kind);
const graph = buildGraph(checkpointer);
const config = { configurable: { thread_id: threadId } };

// A thread that already has checkpoints is carried on rather than
// started again: null means "resume from where you stopped".
const prior = await graph.getState(config);
const input = prior.createdAt
  ? null
  : {
      messages: [
        {
          role: "user" as const,
          content:
            "My Verano hybrid is under warranty and the rear " +
            "hub is grinding. Can you sort it?",
        },
      ],
    };

const final = await graph.invoke(input, config);

console.log(kind, threadId, final.done);
await closeCheckpointer(checkpointer);
