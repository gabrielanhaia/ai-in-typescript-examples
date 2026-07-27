// ch08/order-part.ts
import { Command, interrupt } from "@langchain/langgraph";
import type { Decision, Proposal } from "./approval.js";
import { decide } from "./decide.js";
import { placeOrder } from "./shop.js";
import type { Job } from "./state.js";

export async function orderPart(state: Job) {
  const part = state.part;
  if (part === null) {
    return new Command({
      goto: "notify_customer",
      update: { note: "No hub matched; nothing to order." },
    });
  }

  const proposal: Proposal = {
    action: "order_part",
    summary:
      `Order ${part.name} (${part.code}) from ${part.supplier} ` +
      `for GBP ${part.priceGbp.toFixed(2)}.`,
    code: part.code,
    supplier: part.supplier,
    priceGbp: part.priceGbp,
    frameNumber: state.frameNumber,
  };

  // Nothing above this line may have an effect: on resume the
  // node body runs again from the top, and only interrupt()
  // remembers the answer it was given.
  const answer = interrupt<Proposal, Decision>(proposal);
  const outcome = decide(proposal, answer);

  if (outcome.kind === "decline") {
    return new Command({
      goto: "notify_customer",
      update: { note: outcome.note },
    });
  }

  const ref = await placeOrder(outcome.code, outcome.supplier);
  return new Command({
    goto: "book_workshop_slot",
    update: { orderRef: ref, done: "order_part" },
  });
}
