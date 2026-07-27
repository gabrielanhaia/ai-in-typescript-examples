// NOT A LISTING FROM THE BOOK.
//
// The chapter says: "`TASKS` in the repo is the same set of realistic customer
// messages Book 3's chapter 5 asked you to write, carried forward. One task
// tells you about one task."
//
// Book 3's chapter 5 asks for "a fixed set of tasks — twenty is plenty,
// covering the ones you expect and the three that are deliberately
// ambiguous". Eight ship here rather than twenty, for one reason: every task
// in this array is run twice by ch12/compare.ts, once through a single agent
// and once through a four-agent team, and both of those are real requests
// against a real endpoint. Eight is enough that no single unlucky route moves
// the ratio much, and it is the number you should raise — not lower — before
// you put a multiplier in front of anybody.
//
// The last three are the deliberately ambiguous ones. They are here because a
// task set made only of clean requests measures the topology on its best day,
// and a coordinator's cost shows up on the other days.
//
// Every message describes the one order the fixture in ../shop/tools.ts knows
// about: ORD-4471, frame VER-8802, a Verano hybrid bought 2025-11-03 whose
// rear hub has failed. Nothing here can reach a real customer.

/** The task set both sides of the comparison are run against. */
export const TASKS: readonly string[] = [
  "My Verano hybrid is under warranty and the rear hub is grinding. " +
    "Can you sort it?",
  "Order ORD-4471 — the back wheel has developed a knocking noise " +
    "since last week. What happens next?",
  "Bought a Verano from you in November and the rear hub has gone. " +
    "Is that covered, and how soon can you look at it?",
  "Rear hub failed on frame VER-8802. Please get the part in and book " +
    "me a slot.",
  "The hub on my bike is shot. I need it fixed before the weekend — " +
    "tell me what it costs and when I can bring it in.",

  // The three ambiguous ones.
  "It's making a noise. Can someone take a look?",
  "Is my bike still under warranty? I don't need anything fixed yet, " +
    "I just want to know.",
  "The rear hub is grinding, but I'm away until March, so don't order " +
    "anything yet.",
];
