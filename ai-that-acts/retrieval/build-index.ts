// NOT A LISTING FROM THE BOOK.
//
// Rebuilds `index.json` from `corpus/`. The index is committed, so nobody has
// to run this to use the book; it is here so the fixture is reproducible and
// so adding a document to the corpus is one command.
//
//   npm run retrieval:build
//
// One chunk per `##` section, which is Book 2's by-heading splitter with the
// numbers taken off the section names — the label a citation carries has to be
// a place a reader can find, and "5. Crash replacement" is a table of
// contents entry rather than a place.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

interface Chunk {
  chunkId: string;
  sourceId: string;
  title: string;
  section: string;
  content: string;
}

const CORPUS = new URL("corpus/", import.meta.url);

function titleOf(source: string, fallback: string): string {
  const front = /^---\n([\s\S]*?)\n---/.exec(source);
  const title = front === null ? null : /^title:\s*(.+)$/m.exec(front[1] ?? "");
  return title === null ? fallback : (title[1] ?? fallback).trim();
}

function bodyOf(source: string): string {
  return source.replace(/^---\n[\s\S]*?\n---\n/, "");
}

const chunks: Chunk[] = [];

for (const name of readdirSync(CORPUS).sort()) {
  if (!name.endsWith(".md")) continue;
  const source = readFileSync(new URL(name, CORPUS), "utf8");
  const title = titleOf(source, name);
  const body = bodyOf(source);

  const parts = body.split(/^## +/m);
  parts.shift(); // everything before the first ## heading

  parts.forEach((part, index) => {
    const newline = part.indexOf("\n");
    const heading = part.slice(0, newline === -1 ? part.length : newline);
    const content = part.slice(newline + 1).replace(/\n?---\n?$/, "").trim();
    if (content === "") return;

    const section = heading
      .replace(/^\d+\.\s*/, "")
      .replace(/\s*\{-\}\s*$/, "")
      .trim();

    chunks.push({
      chunkId: `${name}#${String(index).padStart(2, "0")}`,
      sourceId: `markdown/${name}`,
      title,
      section,
      content,
    });
  });
}

writeFileSync(
  new URL("index.json", import.meta.url),
  `${JSON.stringify(chunks, null, 2)}\n`,
);

console.log(`${chunks.length} chunks from ${readdirSync(CORPUS).length} documents`);
