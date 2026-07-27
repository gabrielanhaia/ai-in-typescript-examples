// ch12/compare.ts
import { measure, type Cost } from "./measure.js";
import { oneAgent } from "./single.js";
import { team } from "./team.js";
import { TASKS } from "./tasks.js";

const single = await measure(async (task) => {
  const out = await oneAgent.invoke({
    messages: [{ role: "user", content: task }],
  });
  return out.messages;
}, TASKS);

const many = await measure(async (task) => {
  const out = await team.invoke({
    messages: [{ role: "user", content: task }],
  });
  return out.messages;
}, TASKS);

const tokens = (c: Cost) => c.inputTokens + c.outputTokens;
const ratio = (a: number, b: number): string =>
  b === 0 ? "n/a" : `x${(a / b).toFixed(2)}`;

console.log("tokens ", ratio(tokens(many), tokens(single)));
console.log("calls  ", ratio(many.modelCalls, single.modelCalls));
console.log("latency", ratio(many.ms, single.ms));
