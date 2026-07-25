// Runnable entry point for the chapter: takes a question on the command line,
// sends it under the whole system prompt, prints the answer.
import { ask } from "./chat.js";

const question =
  process.argv.slice(2).join(" ") ||
  "The rear derailleur on my gravel bike is skipping. What should I look at?";

console.log(await ask(question));
