// ch06/forget.ts
import { openCheckpointer, closeCheckpointer } from "./checkpointer.js";
import { forgetOwnership, threadsOwnedBy } from "./ownership.js";

const customer = process.argv[2];
if (!customer) throw new Error("usage: forget <customerId>");

const cp = openCheckpointer("postgres");

for (const thread of await threadsOwnedBy(customer)) {
  await cp.deleteThread(thread);
  console.log("deleted checkpoints for", thread);
}

await forgetOwnership(customer);
await closeCheckpointer(cp);
