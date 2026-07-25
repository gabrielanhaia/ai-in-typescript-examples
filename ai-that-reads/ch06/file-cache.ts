// NOT A LISTING FROM THE BOOK.
//
// Chapter 6 declares `VectorCache` as two methods and no class, and is explicit
// that the thing behind it changes as you go: a file or a small table while you
// are developing, and the vector store itself once chapter 7 exists. Neither
// implementation is ever printed, and `buildIndex` needs one, so this is the
// file-on-disk version.
//
// One file per key, so that a run killed halfway leaves every key it already
// wrote — which is the property chapter 6 says the driver, not the helper, has
// to provide. A single JSON blob rewritten per key would not survive the same
// kill.
//
// The model and the dimension count are already inside the key, so this
// directory can hold vectors from two configurations without confusing them.
// That is chapter 6's rule: identity goes in the key, not in the cache's name.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { VectorCache } from "./cache.js";

export function fileCache(directory: URL): VectorCache {
  let ready: Promise<void> | undefined;

  const ensure = async (): Promise<void> => {
    ready ??= mkdir(directory, { recursive: true }).then(() => undefined);
    return ready;
  };

  return {
    async get(key: string): Promise<number[] | undefined> {
      await ensure();
      try {
        const text = await readFile(new URL(`${key}.json`, directory), "utf8");
        return JSON.parse(text) as number[];
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
      }
    },

    async set(key: string, vector: number[]): Promise<void> {
      await ensure();
      await writeFile(
        new URL(`${key}.json`, directory),
        JSON.stringify(vector),
        "utf8",
      );
    },
  };
}
