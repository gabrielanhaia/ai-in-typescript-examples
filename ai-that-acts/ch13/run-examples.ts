// NOT A LISTING FROM THE BOOK.
//
// The version that should ship, run: ordinary code over the workshop diary,
// with every count counted. No key, and the model's half — the covering
// note — is the one call this chapter makes and is not made here.
//
// The chapter composes the two halves as
//   send(manager, await coveringNote(await weeklyReport(from, to)))
// invoked exactly once from a scheduled entry. Nothing in that line is able
// to talk itself into a second attempt.
import { weeklyReport } from "./weekly-report.js";

console.log(await weeklyReport("2026-07-13", "2026-07-19"));
console.log(
  "\nEvery number above was counted. The threshold that decides what " +
    "gets named\nis a constant in weekly-report.ts, which is the artefact " +
    "the agent version\ndoes not contain anywhere.",
);
