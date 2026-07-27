// NOT A LISTING FROM THE BOOK.
//
// "Try it", exercise 4 — Trim without shrinking. The chapter says: run a long
// conversation with `windowFor` in front of the model call, print
// `state.messages.length` and the length of the trimmed array on every step,
// and watch them diverge. Then read the thread back with `getState` and
// confirm the full history is still sitting in the checkpoint.
//
// Keyless: the turns are canned rather than generated, because the claim
// under test is about `trimMessages` and the checkpointer, not about what a
// model would have said. Everything else — the channel, the reducer, the
// checkpoint — is the real thing.
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { countTokensApproximately } from "langchain";
import { PlanState, type State, type Update } from "./state.js";
import { windowFor } from "./window.js";

/** Sized so the thread clears windowFor's 40,000 around turn 32, with room
 *  either side to watch the two numbers agree and then part company. */
const FILLER =
  "The rear hub is grinding under load and the customer went over it " +
  "again in detail, with the dates, the noise, and the weather. ".repeat(40);

async function turn(state: State): Promise<Update> {
  const n = state.messages.length / 2 + 1;
  return {
    messages: [
      new HumanMessage(`Turn ${n}. ${FILLER}`),
      new AIMessage(`Noted, turn ${n}. ${FILLER}`),
    ],
  };
}

const thread = new StateGraph(PlanState)
  .addNode("turn", turn)
  .addEdge(START, "turn")
  .addEdge("turn", END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "window-demo" } };

console.log("  turn   thread   window   thread tokens");
for (let i = 1; i <= 50; i++) {
  const state = await thread.invoke({ customerId: "cust_4417" }, config);
  if (i % 5 !== 0) continue;

  const window = await windowFor(state);
  const tokens = countTokensApproximately(state.messages);
  console.log(
    `  ${String(i).padStart(4)} ${String(state.messages.length).padStart(8)} ` +
      `${String(window.length).padStart(8)} ${String(tokens).padStart(15)}`,
  );
}

// The thread on disk was never touched. `getState` is chapter 10's subject;
// here it is only the proof.
const snapshot = await thread.getState(config);
console.log(
  `\n  getState says the checkpoint still holds ` +
    `${snapshot.values.messages.length} messages.`,
);
console.log(
  "  Shortening what the model sees is not shortening the thread.",
);
