// ch13/guard.ts
import type { Plan } from "./plan.js";

/** How much of the index one unattended refresh may delete. */
const MAX_DELETE_SHARE = 0.2;

export function refuseSuspiciousDeletes(
  plan: Plan,
  indexed: number,
): void {
  if (indexed === 0 || plan.deleted.length === 0) return;

  const share = plan.deleted.length / indexed;
  if (share <= MAX_DELETE_SHARE) return;

  throw new Error(
    `${plan.deleted.length} of ${indexed} indexed documents are ` +
      `missing from disk (${Math.round(share * 100)}%). Refusing to ` +
      `delete them. Check the corpus path, then re-run with --force.`,
  );
}
