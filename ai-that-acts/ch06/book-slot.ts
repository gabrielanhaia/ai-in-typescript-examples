// PRINTED IN CHAPTER 6 as `ch06/book-slot.ts`.
//
// `Booked`, `Slots` and the body of `offering` are not printed; everything
// else is. Note what `slot_id` requires: a value that had to come back from a
// read, which closes off guessing.
//
// Chapter 5's table holds this surface at six tools, so there is no
// `list_workshop_slots` on it and this tool is the only place a slot id can
// come from. That is why the unbookable branch answers with the times the
// diary has free rather than only with the fact that this one is gone: the
// read and the write are one tool because the surface is small, and the
// chapter says so on the page rather than leaving it to be discovered.
import { z } from "zod";
import { defineTool } from "../ch03/define-tool.js";
import { apiGet, apiPost } from "./api.js";
import type { ToolContext } from "./context.js";

const Booked = z.object({ reference: z.string(), starts: z.string() });
const Slots = z.object({
  slots: z.array(z.object({ slot_id: z.string(), starts: z.string() })),
});

export function bookSlot(ctx: ToolContext) {
  return defineTool(
    "book_workshop_slot",
    "Book one workshop appointment for this customer. Confirm the " +
      "date and the job with them before calling it. If the slot you " +
      "name is not bookable — including on the first call of a run, " +
      "when the diary has not offered you one yet — this answers with " +
      "the times that are free and their ids, so call it again with " +
      "one of those. Returns the booking reference to read back.",
    z.object({
      slot_id: z
        .string()
        .describe(
          "A slot id the diary offered earlier in this run. If none " +
            "has been offered yet, this tool answers with the ids " +
            "that are free.",
        ),
      job: z
        .enum(["service", "wheel-build", "brake-bleed", "assessment"])
        .describe("What the bike is coming in for."),
    }),
    async (input) => {
      const path = "/api/workshop/bookings";
      const outcome = await apiPost(path, input, ctx);

      if (!outcome.ok && outcome.status === 409) {
        return (
          `${input.slot_id} is not bookable — it was taken, or the ` +
          `diary never offered it. Offer the customer one of these ` +
          `instead.${await offering(ctx)}`
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

/** Not printed. The diary read that lets the surface stay at six tools: the
 *  times that are free, with their ids, appended to the sentence the model
 *  reads when a booking did not go through. */
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
