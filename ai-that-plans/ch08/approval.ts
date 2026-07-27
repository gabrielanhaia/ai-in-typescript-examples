// ch08/approval.ts
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
