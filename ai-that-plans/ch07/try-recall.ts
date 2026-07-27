// NOT A LISTING FROM THE BOOK.
//
// "Try it", exercise 1 — Recall across threads. The chapter says: run the
// warranty task on `thread_id: "t1"`, let `remember` write its facts, then run
// a fresh, unrelated question on `thread_id: "t2"` and print the `known` array
// at the top. That array is the entire difference between the two chapters.
//
// Needs ANTHROPIC_API_KEY: `plan` and `remember` both call a model. The store
// is the one compiled into ch07/graph.ts, so it lives for this process and
// both threads read the same one.
import { HumanMessage } from "@langchain/core/messages";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY is not set. This example calls a model — set the key " +
      "in ../.env or the environment and run it again.",
  );
  process.exit(1);
}

// Deferred on purpose. A static import is hoisted above this file's first
// statement, and ch07/graph.ts constructs a ChatAnthropic at module scope —
// so importing it up top would throw the SDK's own error before the check
// above ever ran.
const { graph } = await import("./graph.js");

const customerId = "cust_4417";

const first = await graph.invoke(
  {
    messages: [
      new HumanMessage(
        "My Verano hybrid is under warranty and the rear hub is grinding",
      ),
    ],
    customerId,
  },
  { configurable: { thread_id: "t1" } },
);

console.log("t1 — a brand new customer, nothing in the store yet:");
console.log(`  known: ${JSON.stringify(first.known)}`);
console.log(`  last turn: ${String(first.messages.at(-1)?.text)}`);

// A different thread. New thread_id, new checkpoint chain, no messages
// carried over — and `recall` still finds whatever `remember` wrote.
const second = await graph.invoke(
  { messages: [new HumanMessage("Do you do bike fitting?")], customerId },
  { configurable: { thread_id: "t2" } },
);

console.log("\nt2 — a fortnight later, a different conversation entirely:");
console.log(`  known: ${JSON.stringify(second.known, null, 2)}`);
console.log(
  "\nNothing in t2 said any of that. The checkpointer did not carry it;\n" +
    "the store did.",
);
