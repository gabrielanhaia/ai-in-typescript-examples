// PRINTED IN CHAPTER 1, in full, under "The store, in thirty lines". Nothing is
// added: the write-then-rename and the ENOENT branch are the two things the
// chapter says are not optional, and both are here exactly as printed.
// ch01/store.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RunState } from "./state.js";

const DIR = ".runs";

function fileFor(runId: string): string {
  return join(DIR, `${runId}.json`);
}

/** Undefined means "no such run", which is how the caller tells a
 *  fresh start from a resume. It is not an error. */
export async function load(
  runId: string,
): Promise<RunState | undefined> {
  try {
    const raw = await readFile(fileFor(runId), "utf8");
    return JSON.parse(raw) as RunState;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return undefined;
    throw err;
  }
}

export async function save(state: RunState): Promise<void> {
  await mkdir(DIR, { recursive: true });
  const target = fileFor(state.runId);
  // Write to a scratch name, then rename. Rename is atomic within
  // one filesystem, so a crash mid-write leaves the last good file
  // instead of a truncated one that will never parse again.
  const scratch = `${target}.${process.pid}.tmp`;
  await writeFile(scratch, JSON.stringify(state, null, 2), "utf8");
  await rename(scratch, target);
}
