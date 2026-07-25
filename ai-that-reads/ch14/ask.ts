// ch14/ask.ts
import { retrieve, type Reranked } from "../ch09/retrieve.js";
import { generate } from "../ch10/answer.js";
import type { Citable } from "../ch11/identity.js";
import { renderAnswer, type RenderedAnswer } from "../ch11/render.js";
import { CONTEXT_K } from "./config.js";

/** The store hands metadata back as JSON. The citation fields, named. */
function citable(hit: Reranked): Citable {
  const meta = hit.metadata;
  return {
    chunkId: String(meta.chunkId),
    title: String(meta.title),
    pages: meta.pages as [number, number] | undefined,
    headings: meta.headings as string[] | undefined,
  };
}

export async function ask(question: string): Promise<RenderedAnswer> {
  const context = await retrieve(question, CONTEXT_K);
  const draft = await generate(question, context);
  return renderAnswer(draft, context.map(citable));
}
