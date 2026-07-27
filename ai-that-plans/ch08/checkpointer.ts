// NOT A LISTING FROM THE BOOK.
//
// Chapter 6's checkpointer factory, which chapter 8 uses unchanged — the
// chapter says so in as many words and then imports it from here:
//
//     import { openCheckpointer } from "./checkpointer.js";
//
// It is copied into ch08/ rather than reached for across directories so this
// chapter's folder reads on its own, which is also what the printed import
// path claims.
//
// Two stores, and choosing between them is the chapter's first exercise.
// "memory" lives exactly as long as the process, so a pause raised under it
// dies with the terminal. "sqlite" writes data/braxby.sqlite at the package
// root, which is why `ch08/pause` in one terminal and `ch08/resume` in
// another are the same thread.
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MemorySaver, type BaseCheckpointSaver } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

/** The file the chapter's first exercise tells you to delete. */
const SQLITE_FILE = fileURLToPath(
  new URL("../data/braxby.sqlite", import.meta.url),
);

export type Store = "memory" | "sqlite";

export function openCheckpointer(store: Store): BaseCheckpointSaver {
  if (store === "memory") return new MemorySaver();
  mkdirSync(dirname(SQLITE_FILE), { recursive: true });
  return SqliteSaver.fromConnString(SQLITE_FILE);
}
