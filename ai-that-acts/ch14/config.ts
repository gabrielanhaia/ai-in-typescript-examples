// PRINTED IN CHAPTER 14 as `ch14/config.ts`.
//
// One line here is verified. The rest are settings, and the chapter beside
// each one shows how to arrive at your own.
//
// No sampling setting appears anywhere in this file, and that is not an
// omission. `no-sampling.test.ts` is what enforces it.

/** A fact about the model. Book 1 ch. 14 handed it over at Book 2. */
export const MODEL = "claude-sonnet-5";

/** Generous on purpose. Sonnet 5 runs adaptive thinking by default and
 *  this cap covers the thinking and the answer together, so a loop is
 *  the wrong place to economise on it (ch. 4). */
export const MAX_TOKENS = 8_192;

/** Chapter 9 derived two ceiling profiles. This assistant is the one
 *  with somebody waiting at the other end of it. */
export { INTERACTIVE as LIMITS } from "../ch09/limits.js";

/** How many passages one search returns to the model (ch. 12). */
export const PASSAGES_PER_SEARCH = 5;
