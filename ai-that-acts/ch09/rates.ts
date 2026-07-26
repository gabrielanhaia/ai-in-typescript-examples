// PRINTED IN CHAPTER 9 as `ch09/rates.ts`.
export const USD_PER_MTOK = {
  "claude-sonnet-5": {
    input: 2,
    output: 10,
    // Introductory pricing. It ends 2026-08-31, after which this
    // row is 3 / 15. Cache reads and cache writes are billed at
    // their own rates from the same page — read them, do not guess.
  },
} as const;

/** Taken off the pricing page on the date below. Prices expire; token counts
 *  do not, so `limits.ts` bounds the run in tokens and leaves currency to the
 *  reporting side. */
export const VERIFIED_ON = "2026-07-25";
