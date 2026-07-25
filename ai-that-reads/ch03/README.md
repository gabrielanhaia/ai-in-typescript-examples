# Chapter 3 — Getting your documents in

Three loaders, one output shape, and the three different ways each format lies to you.

| File | What it does |
|---|---|
| [`document.ts`](document.ts) | `SourceMetadata` — seven fields, seven justifications — and `SourceDocument`. |
| [`hash.ts`](hash.ts) | `contentHash`: SHA-256 of the extracted text, first sixteen hex characters. |
| [`load-markdown.ts`](load-markdown.ts) | Strips front matter, takes the first `#` as the title, keeps the Markdown syntax. |
| [`load-html.ts`](load-html.ts) | Drops site furniture, puts the separators back before `.text()`, tidies whitespace. |
| [`load-pdf.ts`](load-pdf.ts) | `pdf-parse`'s class API, `pageJoiner: ""`, one `Document` per page, `destroy()` in a `finally`. |
| [`scanned.ts`](scanned.ts) | `pagesWithoutText` and `reportEmptyPages` — the assertion that a scan is not searchable. |
| [`load-corpus.ts`](load-corpus.ts) | `loadFile`, the extension switch, and `loadCorpus`, the walk. |
| `run-examples.ts` | **Not from the book.** Runs all of the above over the shipped corpus and prints the chapter's four checks. |
| `fixtures/fragment.html` | **Not from the book.** The chapter's HTML fragment, wrapped in a complete page. |

## Run it

Nothing here needs a key, a container or the network.

```bash
npm run run-example -- ch03
```

## Expected output

```text
corpus/pdf/workshop-price-list-2026.pdf: 1 of 1 pages have no text layer (pages 1). Nothing on them is searchable.
31 documents, 34 loaded units
(a PDF is one unit per page, everything else is one per file)

  html      5
  markdown  18
  pdf       11

shortest and longest loaded unit

       0  corpus/pdf/workshop-price-list-2026.pdf p.1
    6999  corpus/markdown/warranty-policy.md

markup that survived extraction

  <div      0 documents
  &nbsp;    0 documents
  <script   0 documents
  ```yaml   0 documents
```

Then the fragment, twice. Through `$("body").text()` alone the table's cells run together — `PartCover`, `Frame5 years` — and the script contents and the navigation are in your corpus. Through `load-html.ts` the same fragment comes out as a table a model can read, with tabs between the cells.

The shortest loaded unit being **zero characters** is the point of `scanned.ts`: `corpus/pdf/workshop-price-list-2026.pdf` is a picture of text, it is in the index, and nothing on it is findable.

## Notes

- **`run-examples.ts` names the three folders rather than walking `corpus/`.** Walking the root picks up `corpus/README.md`, which documents every planted trap and every answer — the mistake chapter 13 describes finding in `scanCorpus`.
- **`sourceId` here is the path the loader was handed, and that is provisional.** Driven from the package root these loaders produce `corpus/markdown/warranty-policy.md`; the identity is `markdown/warranty-policy.md`, the spelling `scanCorpus` computes and `corpus/questions.jsonl` uses. A loader is given one file and cannot know where the corpus root is, so `ch13/sync.ts` restamps every loaded page from `file.sourceId` **before** chunking — one value for the chunk metadata, for `chunkId`, and for the `source_id` column. See [`../ch12/README.md`](../ch12/README.md).
- The corpus is loaded, split and indexed in advance. Nothing here opens a file because a model asked for it.
