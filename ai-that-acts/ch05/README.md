# ch05 — Designing a tool surface

Names, descriptions and granularity, which are the parts of a tool the
compiler does not check and which decide whether the model uses it well.

| File | What it does | Needs |
|---|---|---|
| [`surface.ts`](surface.ts) | `find_orders`, written out in full: the description that names its neighbour, the closed enum, the bounded limit. | — |
| [`digest.ts`](digest.ts) | What a tool result says when there is nothing to find, and what it says when there is too much. Both blocks the book prints, in one file. | — |
| [`god-tool.ts`](god-tool.ts) | A single tool covering a whole domain, kept so you can see what it emits. Nothing calls it. | — |
| `run-examples.ts` | **Not from the book.** Prints both JSON blocks the chapter shows, and both digests. The chapter default. | — |

## Run it

```bash
npm run run-example -- ch05
```

## Expected output

Four blocks. The first is `find_orders`'s emitted schema — read it for
`required`, which holds `email` and not `status` or `limit`, because those two
are `.optional()`.

The second is the god tool's `payload` field: `propertyNames`,
`additionalProperties: {}`, no `required`, no types, no bounds. Every
guarantee `ch03` built, handed back.

The third and fourth are tool results as prose rather than as JSON: one line
per order with the money already formatted, and the sentence that says what
"no orders" means and what to ask next.

## One thing to read twice

`surface.ts` is verbatim from the page, and its description says the line
items live behind `get_order_status`. The chapter's own six-tool table puts
them behind `get_order_items` — `get_order_status` answers "where is this
order?" and nothing more, which is also what its description says in
[`../ch06/toolbox.ts`](../ch06/toolbox.ts). The `ch06` version of the same
tool names `get_order_items`, which is the one the finished surface runs.
