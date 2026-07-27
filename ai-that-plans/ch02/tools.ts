// ch02/tools.ts
/** Book 3's tool surface, carried forward. Chapter 1's sample
 *  order is enough to run this chapter's graph end to end. */
const ORDER = {
  id: "ORD-4471",
  frame: "VER-8802",
  purchased: "2025-11-03",
};

export const STEP_NAMES = [
  "lookup_order",
  "check_warranty",
  "find_parts",
  "order_part",
  "book_workshop_slot",
  "notify_customer",
] as const;

export type Step = (typeof STEP_NAMES)[number];

const STEPS: Record<Step, () => Promise<string>> = {
  lookup_order: async () =>
    `${ORDER.id}, frame ${ORDER.frame}, bought ${ORDER.purchased}`,
  check_warranty: async () => "in cover to 2027-11-03, parts and labour",
  find_parts: async () =>
    "HUB-VR-142 rear hub, in stock, Coldharbour, GBP 68.40",
  // Spends money. Chapter 8 turns this line into a real pause.
  order_part: async () => "refused: a human decides this one",
  book_workshop_slot: async () => "next free bay: Thursday, 09:00",
  notify_customer: async () => "draft written, not sent",
};

export async function runStep(name: string): Promise<string> {
  const step = STEPS[name as Step];
  if (step === undefined) return `unknown step: ${name}`;
  return step();
}
