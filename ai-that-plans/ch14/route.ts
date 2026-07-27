// ch14/route.ts
import { isPartsStep } from "./shop.js";
import type { Job } from "./state.js";

export type Route = "work" | "delegate" | "finish";

export function route(state: Job): Route {
  const step = state.steps[state.cursor];
  if (step === undefined) return "finish";
  return isPartsStep(step) ? "delegate" : "work";
}
