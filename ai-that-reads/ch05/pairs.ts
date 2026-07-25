// ch05/pairs.ts
import { embedPassages } from "../ch02/embed.js";
import { cosine } from "../ch02/cosine.js";

const PAIRS: [string, string][] = [
  [
    "Bare frames are covered by the crash-replacement scheme.",
    "Complete-bike frames are not covered by that scheme.",
  ],
  [
    "Hydraulic disc brakes should be bled every 12 months.",
    "Hydraulic disc brakes should be bled every 6 months.",
  ],
  [
    "Part BRK-2204 replaces the older caliper.",
    "Part BRK-2190 was the older caliper.",
  ],
  [
    "How long is the warranty on a frameset?",
    "Wickhaven frames and rigid forks: 60 months.",
  ],
];

const vectors = await embedPassages(PAIRS.flat());

for (const [index, [left, right]] of PAIRS.entries()) {
  const score = cosine(vectors[index * 2], vectors[index * 2 + 1]);
  console.log(`${score.toFixed(3)}  ${left}\n       ${right}\n`);
}
