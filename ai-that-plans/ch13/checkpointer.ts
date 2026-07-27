// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "`ch13/checkpointer.ts` returns chapter 6's
// `SqliteSaver.fromConnString("./ch13.sqlite")` so the threads outlive the
// process that made them."
//
// That is the whole file. `openCheckpointer()` takes no argument here — every
// printed listing in this chapter calls it as `openCheckpointer()` — because
// the chapter has exactly one store: a file on disk, so that `ch13/inspect`
// in one terminal reads the thread `ch13/run-examples` wrote in another, days
// later, from a process that was not running when the run went wrong.
//
// The path is relative to the working directory, which is the package root:
// `npm run run-example -- ch13/inspect job-4818` and `npx tsx ch13/inspect.ts
// job-4818` are both run from `ai-that-plans/`, so both see ./ch13.sqlite.
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

/** The file this chapter's threads live in. `ch13/run-examples.ts` deletes it
 *  before seeding so the printed traces are reproducible. */
export const SQLITE_FILE = "./ch13.sqlite";

export function openCheckpointer(): BaseCheckpointSaver {
  return SqliteSaver.fromConnString(SQLITE_FILE);
}
