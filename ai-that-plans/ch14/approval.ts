// NOT A LISTING FROM CHAPTER 14.
//
// Chapter 8's `ch08/approval.ts`, imported unchanged — which is the point the
// chapter makes out loud: "the shape a human is shown and the shape they may
// answer with did not change when the gate moved from a node into a tool."
// Copied into ch14/ rather than reached for across directories, so this
// chapter's folder reads on its own and the printed `from "./approval.js"`
// resolves. Byte-for-byte the same file as ch08/approval.ts, minus its header.
/** Exactly what the human is asked to look at. JSON only: this
 *  object is written into a checkpoint and read back by another
 *  process, possibly on another day. */
export interface Proposal {
  action: "order_part";
  summary: string;
  code: string;
  supplier: string;
  priceGbp: number;
  frameNumber: string;
}

/** The three answers, as one discriminated union. A fourth answer
 *  would be a fourth member here and a fourth branch below. */
export type Decision =
  | { type: "approve" }
  | { type: "edit"; code: string; supplier: string; priceGbp: number }
  | { type: "reject"; reason: string };
