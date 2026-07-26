// PRINTED IN CHAPTER 13 as `ch13/weekly-report.ts`.
//
// Every count in here is counted and not estimated, and the threshold that
// decides what "needs chasing" means is a constant a reviewer can argue with.
import { bookingsBetween, type Booking } from "../app/workshop.js";

const STALLED_AFTER_DAYS = 5;

export async function weeklyReport(
  from: string,
  to: string,
): Promise<string> {
  const week = await bookingsBetween(from, to);
  const inStatus = (status: Booking["status"]) =>
    week.filter((booking) => booking.status === status);

  const waiting = inStatus("awaiting-parts");
  const stalled = waiting.filter(
    (b) => b.waitingDays > STALLED_AFTER_DAYS,
  );

  return [
    `Manchester workshop, ${from} to ${to}`,
    `${week.length} booked, ${inStatus("completed").length} completed, ` +
      `${inStatus("rebooked").length} rebooked, ` +
      `${waiting.length} awaiting parts.`,
    ...stalled.map(
      (b) =>
        `  ${b.reference} — ${b.job}, waiting ${b.waitingDays} days ` +
        `for ${b.part}`,
    ),
  ].join("\n");
}
