// PRINTED IN CHAPTER 10 as `ch10/hitl.ts`.
//
// Present for reading, not for running. Add it on its own and the first
// gated call fails with `GraphValueError: No checkpointer set`; satisfying
// that needs a saver from `@langchain/langgraph`, which this manifest leaves
// out on purpose because persistence belongs to the following book.
//
// Nothing imports this file. Chapter 8's twenty-line gate is what the
// application runs.
import { humanInTheLoopMiddleware } from "langchain";

export const review = humanInTheLoopMiddleware({
  interruptOn: {
    issue_refund: {
      allowedDecisions: ["approve", "edit", "reject"],
      description: "A refund needs a human before it runs.",
    },
    get_order_status: false,
  },
});
