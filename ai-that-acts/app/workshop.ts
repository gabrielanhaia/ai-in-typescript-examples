// NOT A LISTING FROM THE BOOK.
//
// The workshop diary, which chapter 13 imports from `../app/workshop.js` and
// reads without a model anywhere near it.
import { db } from "./db.js";
import { seed } from "./seed.js";

export interface Booking {
  readonly reference: string;
  readonly status: "completed" | "rebooked" | "awaiting-parts" | "booked";
  readonly job: string;
  readonly waitingDays: number;
  readonly part: string;
}

export async function bookingsBetween(
  from: string,
  to: string,
): Promise<Booking[]> {
  seed();
  const rows = db()
    .prepare(
      "SELECT reference, status, job, waiting_days, part" +
        " FROM workshop_bookings" +
        " WHERE date(booked_for) BETWEEN date(?) AND date(?)" +
        " ORDER BY booked_for",
    )
    .all(from, to) as {
      reference: string;
      status: Booking["status"];
      job: string;
      waiting_days: number;
      part: string;
    }[];

  return rows.map((row) => ({
    reference: row.reference,
    status: row.status,
    job: row.job,
    waitingDays: row.waiting_days,
    part: row.part,
  }));
}
