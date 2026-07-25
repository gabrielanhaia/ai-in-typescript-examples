export interface Band {
  maxGrams: number;
  pence: number;
}

const UK: readonly Band[] = [
  { maxGrams: 2_000, pence: 399 },
  { maxGrams: 10_000, pence: 699 },
  { maxGrams: Number.POSITIVE_INFINITY, pence: 1_199 },
];

export function shippingPence(grams: number): number {
  const band = UK.find((b) => grams <= b.maxGrams);
  if (band === undefined) throw new Error(`no band for ${grams}g`);
  return band.pence;
}
