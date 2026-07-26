// PRINTED IN CHAPTER 12 as `ch12/search-tool.ts`.
//
// NOT PRINTED: `DESCRIPTION`. The chapter quotes the two sentences in it that
// produce the second search, and chapter 5 is the argument for the rest of
// it — what the tool does, what comes back, and what to do when the first
// search is thin.
import { z } from "zod";
import { defineTool, type RegisteredTool } from "../ch03/define-tool.js";
import { retrieve } from "../retrieval/retrieve.js";
import { passagesFor } from "./passages.js";

const DESCRIPTION =
  "Search the Braxby Cycles documentation: the warranty policy, the " +
  "returns policy, the workshop service terms, the workshop bulletins, " +
  "the shipping terms and the order lifecycle. Returns up to five " +
  "passages, each headed by the document and section it came from in " +
  "square brackets. Quote that heading when you use a passage. " +
  "If the first search comes back thin, search once more in the shop's " +
  "own words before telling the customer there is no policy.";

export function searchDocs(sources: Map<string, string>): RegisteredTool {
  return defineTool(
    "search_docs",
    DESCRIPTION,
    z.object({
      query: z
        .string()
        .describe(
          "What to look for, written as the documentation would put " +
            "it, not as the customer said it.",
        ),
    }),
    async ({ query }) =>
      passagesFor(await retrieve(query, 5), query, sources),
  );
}
