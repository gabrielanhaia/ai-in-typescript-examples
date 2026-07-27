// NOT A LISTING FROM THE BOOK.
//
// The one thing in ch04 that calls the model, and it exists to settle the one
// claim in the chapter that only a running graph can settle:
//
//   "Run both graphs on the warranty job and they produce the same six
//    completed steps in the same order."
//
// So it runs the conditional-edge graph through ch04/limit.ts's runPlan, then
// the Command graph on the same request, and prints both completed lists.
// `find_parts` fails on its first attempt at a given cursor, so the retry
// route fires in both runs — resetFlakiness() puts the second run back on the
// same footing as the first.
import { HumanMessage } from "@langchain/core/messages";
import { commandGraph } from "./command-graph.js";
import { budgetFor, runPlan } from "./limit.js";
import { resetFlakiness } from "./tools.js";

const REQUEST =
  "My Verano hybrid is under warranty and the rear hub is " +
  "grinding. Can you sort it?";

if ((process.env.ANTHROPIC_API_KEY ?? "") === "") {
  console.error(
    "ANTHROPIC_API_KEY is not set, and the plan node calls the model.\n" +
      "  1. cp ../.env.example ../.env\n" +
      "  2. put your key in it, on one line, no quotes\n" +
      "  3. run this again\n" +
      "Get a key at https://console.anthropic.com/.\n\n" +
      "Everything else in this chapter runs without one:\n" +
      "  npx tsx ch04/run-examples.ts",
  );
  process.exit(1);
}

// Six planned steps and two retries allowed, which is eighteen supersteps.
const limit = budgetFor(6, 2);
const input = { messages: [new HumanMessage(REQUEST)] };

resetFlakiness();
const edge = await runPlan(input, limit);

if (!edge.done) {
  console.log(`conditional edge  gave up: ${edge.reason} at ${edge.limit}`);
  process.exit(1);
}

console.log(`limit             ${limit}`);
console.log(`conditional edge  ${edge.state.completed.join(", ")}`);
console.log(`                  ${edge.state.messages.at(-1)?.text ?? ""}`);

resetFlakiness();
const command = await commandGraph.invoke(input, { recursionLimit: limit });

console.log(`Command           ${command.completed.join(", ")}`);
console.log(`                  ${command.messages.at(-1)?.text ?? ""}`);

const same =
  edge.state.completed.join("|") === command.completed.join("|") &&
  edge.state.completed.length > 0;
console.log(`same six steps, same order: ${same}`);
