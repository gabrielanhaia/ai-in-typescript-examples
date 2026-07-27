// NOT A LISTING FROM THE BOOK.
//
// The chapter's last checklist row, made runnable: "`getGraphAsync()` then
// `drawMermaid()`, and check it against what you believe you built." It is
// the row nobody runs, which is why it is two lines and a script rather than
// a paragraph telling you to write them.
//
// `xray: 1` is what makes the drawing descend one level into the parts
// specialist. It can only do that because `graph.ts` passed the compiled
// specialist twice — once as the node and once in `subgraphs` — so leave that
// option off and the whole delegation is a single box called `parts`.
//
// Spends nothing: no model is called and no checkpoint is written. It still
// needs ANTHROPIC_API_KEY to be *present*, because building the assistant
// constructs two chat models, and it does not need Postgres to be up.
import "./env.js";
import { assistant } from "./build.js";

const graph = await assistant.getGraphAsync({ xray: 1 });
console.log(graph.drawMermaid());

process.exit(0);
