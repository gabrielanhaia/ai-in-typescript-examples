import * as readline from "node:readline/promises";
import { answer } from "./answer.js";
import { newConversation } from "./history.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let history = newConversation();

for (;;) {
  const question = (await rl.question("\nyou> ")).trim();
  if (question === "" || question === "/quit") break;

  const controller = new AbortController();
  const interrupt = () => controller.abort();
  rl.on("SIGINT", interrupt);
  process.stdout.write("\nbot> ");

  try {
    const turn = await answer(
      history,
      question,
      (text) => process.stdout.write(text),
      controller.signal,
    );
    history = turn.history;
    if (turn.finish.kind === "truncated") {
      process.stdout.write(` [cut off: ${turn.finish.cause}]`);
    }
  } catch (error) {
    if (!controller.signal.aborted) throw error;
    process.stdout.write(" [stopped]");
  } finally {
    rl.off("SIGINT", interrupt);
    process.stdout.write("\n");
  }
}

rl.close();
