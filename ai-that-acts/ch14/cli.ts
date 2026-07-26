// NOT A LISTING FROM THE BOOK, but the file chapter 14's tree names: "a
// question in, an answer and a transcript out".
//
// `run` hands a value back rather than writing to a terminal, so a route, a
// worker or a test can drive it. Deciding what a person sees happens here.
//
//   npx tsx ch14/cli.ts "<the customer's message>"
//   npm run run-example -- ch14 "<the customer's message>" --trace
import { trace } from "../ch04/trace.js";
import { cliReviewer } from "../ch08/cli.js";
import { citationsIn } from "../ch12/cited.js";
import { run } from "./agent.js";

const question = process.argv[2];
if (question === undefined || question.trim() === "") {
  console.error('Usage: cli.ts "your question" [--trace]');
  process.exit(1);
}

const controller = new AbortController();
const signal = AbortSignal.any([
  controller.signal,
  AbortSignal.timeout(120_000),
]);

try {
  const out = await run(
    { customerId: "cust_4471", token: "token-for-4471", signal },
    question,
    cliReviewer(),
  );

  const answer =
    out.reply === undefined
      ? "That request was cancelled."
      : out.reply.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");

  console.log(`\n${answer}\n`);

  const { cited, unresolved } = citationsIn(answer, out.sources);
  for (const one of cited) {
    console.error(`cited ${one.label} -> ${one.chunkId}`);
  }
  // Never into the answer.
  for (const one of unresolved) console.error(`unresolved ${one}`);

  console.error(
    `run ended=${out.why.kind} steps=${out.spent.steps} ` +
      `tokens=${out.spent.tokens} ms=${out.spent.ms}`,
  );

  if (process.argv.includes("--trace")) {
    console.error("");
    trace(out.messages);
  }
} finally {
  // Chapter 9: aborting the run when it ends closes the sockets the tools
  // from an earlier step may still be holding.
  controller.abort();
}
