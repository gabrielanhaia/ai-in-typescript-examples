// ch03/load-html.ts
import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";
import { contentHash } from "./hash.js";
import type { SourceDocument } from "./document.js";

const DROP = "script, style, noscript, nav, header, footer, aside, form";
const BLOCKS = "p, li, tr, h1, h2, h3, h4, h5, h6, blockquote, pre";

export async function loadHtml(path: string): Promise<SourceDocument> {
  const $ = cheerio.load(await readFile(path, "utf8"));
  const title = $("title").first().text().trim();

  $(DROP).remove();
  $("td, th").each((_, el) => {
    $(el).after("\t");
  });
  $(BLOCKS).each((_, el) => {
    $(el).after("\n");
  });

  const root = $("main").length > 0 ? $("main") : $("body");
  const text = root
    .text()
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return new Document({
    pageContent: text,
    metadata: {
      sourceId: path,
      title: title.length > 0 ? title : path,
      type: "html",
      hash: contentHash(text),
      loadedAt: new Date().toISOString(),
    },
  });
}
