// PRINTED IN CHAPTER 13 as `ch13/report-tools.ts` — the surface the agent
// version of the weekly report is given, and the one thing it is not given.
//
// Three tools, all reads, and no `send_email`. The email a report has to end
// with is the one operation on chapter 8's `external` rung — it has already
// reached a person outside the building and there is no undo — so it is not
// on the surface at all, and the caller sends it in a line of code the model
// cannot re-enter. That is the same decision the shipping version makes, and
// it is what stops this chapter's bad example from also being a bad example
// of chapter 8.
//
// `find_orders` is chapter 5's, imported and not rewritten, so the agent can
// read across into the parts side the way its author hoped it would.
import { z } from "zod";
import { defineTool, type RegisteredTool } from "../ch03/define-tool.js";
import type { Session } from "../ch06/session.js";
import { findOrders } from "../ch05/surface.js";
import { bookingFor, bookingsBetween } from "../app/workshop.js";

const listBookings = defineTool(
  "list_bookings",
  "List the Manchester workshop's bookings between two dates. Returns " +
    "one line per booking: reference, job, status, and the part it is " +
    "waiting for if it is waiting for one. Call get_booking for the " +
    "detail on any single one.",
  z.object({
    from: z.string().describe("First day to include, as YYYY-MM-DD."),
    to: z.string().describe("Last day to include, as YYYY-MM-DD."),
  }),
  async ({ from, to }) => {
    const week = await bookingsBetween(from, to);
    if (week.length === 0) return `No bookings between ${from} and ${to}.`;

    return week
      .map(
        (booking) =>
          `${booking.reference}  ${booking.job}  ${booking.status}` +
          `${booking.part === "" ? "" : `  waiting for ${booking.part}`}`,
      )
      .join("\n");
  },
);

const getBooking = defineTool(
  "get_booking",
  "The detail on one workshop booking, by its reference: the job, the " +
    "status, the part it is waiting for, and how long it has been " +
    "waiting. Use find_orders to follow a part number into the orders " +
    "side.",
  z.object({
    reference: z
      .string()
      .describe("The booking reference, like WS-2211."),
  }),
  async ({ reference }) => {
    const booking = await bookingFor(reference);
    if (booking === undefined) {
      return (
        `There is no booking ${reference} in the diary. Check the ` +
        `reference against the list from list_bookings.`
      );
    }

    const waiting =
      booking.part === ""
        ? "Not waiting on a part."
        : `Waiting ${booking.waitingDays} days for ${booking.part}.`;

    return (
      `${booking.reference}: ${booking.job}, ${booking.status}. ${waiting}`
    );
  },
);

/** The report agent's own surface. Nothing on it writes, so the run is bounded
 *  by chapter 9's ceilings and by nothing else — which is the only reason an
 *  unattended loop is safe to leave in a repository at all. */
export function reportSession(): Session {
  const tools: RegisteredTool[] = [listBookings, getBooking, findOrders];

  return {
    definitions: tools.map((tool) => tool.definition),
    byName: new Map(tools.map((tool) => [tool.definition.name, tool])),
  };
}
