import { partExists } from "./catalogue.js";

export function checkedPart(suggested: string): string | null {
  return partExists(suggested) ? suggested : null;
}
