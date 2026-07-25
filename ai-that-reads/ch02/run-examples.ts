// NOT A LISTING FROM THE BOOK.
//
// Chapter 2's two keeper modules — `cosine` and `tinySearch` — are pure
// functions with no output of their own. This driver exercises both on the
// vectors in ch02/fixtures/shelf.json, so that the chapter has something you
// can run on a clean clone with no API key.
//
// The vectors are hand-written and eight-dimensional. They are not embeddings.
// What they are is small enough that you can check the arithmetic yourself,
// which is the point chapter 2 makes about writing the loop out by hand.
//
// The real thing is ch02/tiny-rag.ts, and it costs one embedding call.
import { readFile } from "node:fs/promises";
import { cosine } from "./cosine.js";
import { tinySearch, type Shelved } from "./tiny-search.js";

interface Fixture {
  note: string;
  shelf: Shelved[];
  questions: { question: string; vector: number[] }[];
}

const fixture = JSON.parse(
  await readFile(new URL("fixtures/shelf.json", import.meta.url), "utf8"),
) as Fixture;

console.log("the linear scan\n");

for (const asked of fixture.questions) {
  console.log(asked.question);
  for (const hit of tinySearch(fixture.shelf, asked.vector, 3)) {
    console.log(`  ${hit.score.toFixed(4)}  ${hit.name}`);
  }
  console.log();
}

// Chapter 2's three-line check: some providers return vectors already
// normalised to length 1, and when they do, the dot product alone is the
// cosine. Check, do not assume.
console.log("are these vectors unit length?\n");
for (const entry of fixture.shelf) {
  const length = Math.sqrt(entry.vector.reduce((sum, x) => sum + x * x, 0));
  console.log(`  ${length.toFixed(6)}  ${entry.name}`);
}

// And the check that catches the retrieval bug people inflict on themselves
// most often: a corpus embedded by one model, searched with a query vector
// from a different one.
console.log("\nthe dimension guard\n");
try {
  cosine([1, 0, 0], [1, 0]);
} catch (error) {
  console.log(`  ${(error as Error).message}`);
}
