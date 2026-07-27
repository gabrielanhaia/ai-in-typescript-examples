// NOT A LISTING FROM CHAPTER 14.
//
// Chapter 8's `ch08/decide.ts`, imported unchanged. Still a pure function on
// plain values with nothing imported from LangGraph, which is why moving the
// gate from a node into a tool cost it nothing.
import type { Decision, Proposal } from "./approval.js";

/** What the graph should do next, as data rather than as an
 *  effect — so a test can assert on it without a supplier. */
export type Outcome =
  | { kind: "place"; code: string; supplier: string }
  | { kind: "decline"; note: string };

export function decide(
  proposal: Proposal,
  decision: Decision,
): Outcome {
  switch (decision.type) {
    case "reject":
      return {
        kind: "decline",
        note: `Order declined: ${decision.reason}`,
      };
    case "edit":
      return {
        kind: "place",
        code: decision.code,
        supplier: decision.supplier,
      };
    case "approve":
      return {
        kind: "place",
        code: proposal.code,
        supplier: proposal.supplier,
      };
  }
}
