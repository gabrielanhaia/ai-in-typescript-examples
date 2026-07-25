// The something-you-hold that verify.ts checks against. A real catalogue is a
// database query; the point is that it is yours and the model's answer is not.
import { isPartNumber } from "./part-number.js";

const CATALOGUE = new Set([
  "BRK-1180",
  "CHN-4412",
  "CST-9003",
  "WHL-4821",
  "TYR-3277",
]);

export function partExists(part: string): boolean {
  return isPartNumber(part) && CATALOGUE.has(part);
}
