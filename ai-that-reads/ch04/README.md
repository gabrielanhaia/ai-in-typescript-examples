# Chapter 4 — Chunking

Where to cut, measured rather than copied.

| File | What it does |
|---|---|
| [`fixed.ts`](fixed.ts) | `splitFixed` — ten lines, and the clearest failure in the chapter. |
| [`chunk.ts`](chunk.ts) | `ChunkMetadata` and `Chunk`: `chunkIndex`, the stable `chunkId`, and the `pages` range. |
| [`by-heading.ts`](by-heading.ts) | `splitByHeading` — the heading trail, into the text and into the metadata. |
| [`recursive.ts`](recursive.ts) | `makeSplitter` and `chunkDocument`, the practical default. |
| [`pages.ts`](pages.ts) | `chunkPages` — concatenate a PDF's pages, chunk, record the page range each chunk spans. |
| [`sweep.ts`](sweep.ts) | recall@5 at four chunk sizes over the real corpus. Calls the embedding model. |
| `run-examples.ts` | **Not from the book.** Runs every splitter over the chapter's own warranty paragraph. |

## Run it

Keyless:

```bash
npm run run-example -- ch04
```

The sweep embeds the corpus once per size, so it needs `OPENAI_API_KEY` and it is the expensive one:

```bash
npm run run-example -- ch04/sweep
```

## Expected output

`run-examples.ts` reproduces every number the chapter prints:

```text
the paragraph is 520 characters

splitFixed(200, 0): 3 chunks
  lengths  200, 200, 120
  1 ends   ...y covers the original purchaser only and is not transferab
  2 begins le. Wheels, drivetrain components, and finishing kit carry...

recursive, default separators: 3 chunks
  lengths  189, 197, 132
  1 ends   ...The warranty covers the original purchaser only and is not
  2 begins transferable. Wheels, drivetrain components, and finishing...

recursive, with ". " added: 4 chunks
  lengths  129, 149, 122, 120
```

`transferable` is cut in half by the fixed splitter and whole under the recursive one — and the *sentence* is still split until `". "` is added to the separator list.

Then the tiny-chunk damage, on a 169-character document:

```text
heading-aware separators at 120: 3 chunks, lengths 17, 67, 82
  first chunk: "## Frame warranty"
heading-aware separators at 200: 1 chunks, lengths 169
```

Seventeen characters of pure heading, embedded and indexed and carrying no information. Nothing changed but a number and nothing raised an error. That is why you print the chunks and look.

## Notes

- The paragraph is joined into one line before splitting, as the chapter instructs. Leave the newlines in and the recursive splitter cuts on them and every number above changes.
- `chunkOverlap` is a **maximum applied while merging**, not a stride: ask for 40 and this paragraph gives you none, because the pieces happened to fit.
- `sweep.ts` calls `loadCorpus("corpus")`, which picks up `corpus/README.md` alongside the corpus. It only affects the chunk count, not the recall figure, but it is the same wart chapter 13 fixes with an explicit folder list.
- This repo runs `chunkPages`, the second of the chapter's three PDF strategies, so a citation reads `pp. 2-3` when a chunk straddled a break.
