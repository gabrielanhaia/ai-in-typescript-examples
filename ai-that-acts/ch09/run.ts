// PRINTED IN CHAPTER 9 as `ch09/run.ts` — the composed signal, and the
// session it goes into.
//
// The chapter prints the five lines with `fromRequest`, `customerId`,
// `token` and `runId` already in scope. Here they come from somewhere, so the
// file runs: there is no HTTP request in front of this one, so `fromRequest`
// is a controller nobody pulls.
//
// Keyless. It builds the surface and prints it; it calls nothing.
import { sessionFor } from "../ch06/session.js";
import { INTERACTIVE } from "./limits.js";

const customerId = "cust_4471";
const token = "token-for-4471";
const runId = "r_8f21";
const fromRequest = new AbortController().signal;

const run = new AbortController();
const signal = AbortSignal.any([
  run.signal,
  fromRequest,
  AbortSignal.timeout(INTERACTIVE.maxWallMs),
]);

const session = sessionFor({ customerId, token, runId, signal });

console.log(
  `${session.definitions.length} tools, one composed signal, ` +
    `${INTERACTIVE.maxSteps} steps / ${INTERACTIVE.maxTokens} tokens / ` +
    `${INTERACTIVE.maxWallMs} ms`,
);
console.log(`aborted: ${signal.aborted}`);

// Not housekeeping. A loop that answers early leaves earlier steps' requests
// in flight; firing the controller on the way out shuts them down instead of
// paying for work nobody reads.
run.abort();
console.log(`aborted after the run ends: ${signal.aborted}`);
