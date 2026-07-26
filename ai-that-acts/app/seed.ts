// NOT A LISTING FROM THE BOOK.
//
// The shop's data, so the service starts with something in it. Every order,
// refund, booking and part here is invented. ORD-4471 is the order the book
// asks about from chapter 2 onward: a workshop-built rear wheel, £89.00,
// dispatched with Evri, which is what makes chapter 14's run work.
import { db, isEmpty } from "./db.js";

const CUSTOMER = "cust_4471";
const EMAIL = "rowan.pike@example.com";

interface SeedOrder {
  order_id: string;
  status: string;
  placed: string;
  delivered: string | null;
  total_cents: number;
  carrier: string | null;
  tracking: string | null;
  lines: { sku: string; name: string; qty: number; unit_cents: number;
    workshop_built?: boolean }[];
}

const ORDERS: SeedOrder[] = [
  {
    order_id: "ORD-4471",
    status: "dispatched",
    placed: "2026-07-16",
    delivered: "2026-07-22",
    total_cents: 8900,
    carrier: "Evri",
    tracking: "H00A1234567890",
    lines: [
      {
        sku: "WHL-5120",
        name: "Emberly XR wheelset, rear, workshop build",
        qty: 1,
        unit_cents: 8900,
        workshop_built: true,
      },
    ],
  },
  {
    order_id: "ORD-4472",
    status: "picking",
    placed: "2026-07-21",
    delivered: null,
    total_cents: 4250,
    carrier: null,
    tracking: null,
    lines: [
      { sku: "BRK-1180", name: "Halvard R4 rear adapter, 180 mm",
        qty: 1, unit_cents: 2400 },
      { sku: "DRV-4402", name: "Draycott 11-34 cassette",
        qty: 1, unit_cents: 1850 },
    ],
  },
  {
    order_id: "ORD-4310",
    status: "delivered",
    placed: "2026-05-02",
    delivered: "2026-05-06",
    total_cents: 12500,
    carrier: "Evri",
    tracking: "H00A9988776655",
    lines: [
      { sku: "FRM-2201", name: "Braxby Kestrel bare frame, 56 cm",
        qty: 1, unit_cents: 12500 },
    ],
  },
];

const STOCK = [
  { sku: "WHL-5120", name: "Emberly XR wheelset, rear", on_hand: 2,
    restock: null },
  { sku: "BRK-1180", name: "Halvard R4 rear adapter, 180 mm", on_hand: 0,
    restock: "2026-08-04" },
  { sku: "DRV-4402", name: "Draycott 11-34 cassette", on_hand: 14,
    restock: null },
  { sku: "FRM-2201", name: "Braxby Kestrel bare frame, 56 cm", on_hand: 1,
    restock: null },
];

const SLOTS = [
  { slot_id: "SLOT-3301", starts: "2026-07-30 09:00" },
  { slot_id: "SLOT-3302", starts: "2026-07-30 14:30" },
  { slot_id: "SLOT-3303", starts: "2026-07-31 11:00" },
];

// Last week's diary, which is what chapter 13's report counts. WS-2211 is the
// one over the five-day threshold and the one its test asserts on.
const BOOKINGS = [
  { reference: "WS-2207", slot_id: "SLOT-3290", job: "service",
    status: "completed", booked_for: "2026-07-13 09:00",
    waiting_days: 0, part: "" },
  { reference: "WS-2208", slot_id: "SLOT-3291", job: "brake-bleed",
    status: "completed", booked_for: "2026-07-14 11:30",
    waiting_days: 0, part: "" },
  { reference: "WS-2209", slot_id: "SLOT-3292", job: "wheel-build",
    status: "completed", booked_for: "2026-07-15 09:00",
    waiting_days: 0, part: "" },
  { reference: "WS-2210", slot_id: "SLOT-3293", job: "assessment",
    status: "rebooked", booked_for: "2026-07-16 15:00",
    waiting_days: 0, part: "" },
  { reference: "WS-2211", slot_id: "SLOT-3294", job: "brake-bleed",
    status: "awaiting-parts", booked_for: "2026-07-17 10:00",
    waiting_days: 6, part: "BRK-1180" },
  { reference: "WS-2212", slot_id: "SLOT-3295", job: "service",
    status: "awaiting-parts", booked_for: "2026-07-17 14:00",
    waiting_days: 5, part: "DRV-4402" },
];

export function seed(force = false): void {
  const handle = db();
  if (!force && !isEmpty()) return;

  handle.exec(
    "DELETE FROM orders; DELETE FROM order_lines; DELETE FROM stock;" +
      "DELETE FROM workshop_slots; DELETE FROM workshop_bookings;",
  );

  const order = handle.prepare(
    "INSERT INTO orders (order_id, customer_id, email, status, placed," +
      " delivered, total_cents, carrier, tracking)" +
      " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const line = handle.prepare(
    "INSERT INTO order_lines (order_id, sku, name, qty, unit_cents," +
      " workshop_built) VALUES (?, ?, ?, ?, ?, ?)",
  );

  for (const row of ORDERS) {
    order.run(row.order_id, CUSTOMER, EMAIL, row.status, row.placed,
      row.delivered, row.total_cents, row.carrier, row.tracking);
    for (const item of row.lines) {
      line.run(row.order_id, item.sku, item.name, item.qty, item.unit_cents,
        item.workshop_built === true ? 1 : 0);
    }
  }

  const stock = handle.prepare(
    "INSERT INTO stock (sku, name, on_hand, restock) VALUES (?, ?, ?, ?)",
  );
  for (const row of STOCK) {
    stock.run(row.sku, row.name, row.on_hand, row.restock);
  }

  const slot = handle.prepare(
    "INSERT INTO workshop_slots (slot_id, starts, taken) VALUES (?, ?, 0)",
  );
  for (const row of SLOTS) slot.run(row.slot_id, row.starts);

  const booking = handle.prepare(
    "INSERT INTO workshop_bookings (reference, slot_id, customer_id, job," +
      " status, booked_for, waiting_days, part)" +
      " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const row of BOOKINGS) {
    booking.run(row.reference, row.slot_id, CUSTOMER, row.job, row.status,
      row.booked_for, row.waiting_days, row.part);
  }
}

// `npm run app:seed -- --force` puts it back the way it was.
if (process.argv[1]?.endsWith("seed.ts") === true) {
  seed(process.argv.includes("--force"));
  console.log("braxby: seeded");
}
