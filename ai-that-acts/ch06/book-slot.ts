// PRINTED IN CHAPTER 6 as `ch06/book-slot.ts`.
//
// `Booked` and the extra sentence in the failure branch are not printed;
// everything else is. Note what `slot_id` requires: a value that had to come
// back from an earlier read, which closes off guessing.
import { z } from "zod";
import { defineTool } from "../ch03/define-tool.js";
import { apiGet, apiPost } from "./api.js";
import type { ToolContext } from "./context.js";

const Booked = z.object({ reference: z.string(), starts: z.string() });
const Slots = z.object({
  slots: z.array(z.object({ slot_id: z.string(), starts: z.string() })),
});

export function bookSlot(ctx: ToolContext, runId: string) {
  return defineTool(
    "book_workshop_slot",
    "Book one workshop appointment for this customer. Confirm the " +
      "date and the job with them before calling it. Returns the " +
      "booking reference to read back to them.",
    z.object({
      slot_id: z
        .string()
        .describe("A slot id the diary offered earlier in this run."),
      job: z
        .enum(["service", "wheel-build", "brake-bleed", "assessment"])
        .describe("What the bike is coming in for."),
    }),
    async (input) => {
      const path = "/api/workshop/bookings";
      const outcome = await apiPost(path, input, ctx, runId);

      if (!outcome.ok && outcome.status === 409) {
        return (
          `That slot was taken while you were confirming it. Offer ` +
          `the customer one of the other times the diary gave you.` +
          `${await offering(ctx)}`
        );
      }

      if (!outcome.ok) {
        throw new Error(
          `workshop api ${outcome.status}: ${outcome.detail}`,
        );
      }

      const { reference, starts } = Booked.parse(outcome.body);
      return (
        `Booked. Reference ${reference}, ${starts}, ` +
        `Manchester workshop.`
      );
    },
  );
}

/** Not printed. The six-tool surface has no diary-read tool on it, so the
 *  only place the model can learn a slot id is a failed booking. This appends
 *  the times that are free to the sentence it reads. */
async function offering(ctx: ToolContext): Promise<string> {
  const outcome = await apiGet("/api/workshop/slots", ctx);
  if (!outcome.ok) return "";

  const { slots } = Slots.parse(outcome.body);
  if (slots.length === 0) return " The diary has nothing free this week.";

  const times = slots
    .map((slot) => `${slot.starts} (${slot.slot_id})`)
    .join("; ");
  return ` Free at the moment: ${times}.`;
}
