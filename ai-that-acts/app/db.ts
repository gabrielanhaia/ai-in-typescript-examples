// NOT A LISTING FROM THE BOOK.
//
// The sample application's database. Node 24 ships a SQLite driver, so this
// costs no dependency and no second container.
//
// The connection is opened lazily, on first use, so that importing a module
// from this directory in a unit test does not create a file.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DB_PATH } from "./config.js";

let handle: DatabaseSync | undefined;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  order_id     TEXT PRIMARY KEY,
  customer_id  TEXT NOT NULL,
  email        TEXT NOT NULL,
  status       TEXT NOT NULL,
  placed       TEXT NOT NULL,
  delivered    TEXT,
  total_cents  INTEGER NOT NULL,
  carrier      TEXT,
  tracking     TEXT
);

CREATE INDEX IF NOT EXISTS orders_by_email ON orders (email, placed DESC);

CREATE TABLE IF NOT EXISTS order_lines (
  order_id       TEXT NOT NULL,
  sku            TEXT NOT NULL,
  name           TEXT NOT NULL,
  qty            INTEGER NOT NULL,
  unit_cents     INTEGER NOT NULL,
  workshop_built INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, sku)
);

CREATE TABLE IF NOT EXISTS refunds (
  refund_id       TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  order_id        TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  note            TEXT,
  at              TEXT NOT NULL
);

-- Chapter 7 turns on this line. A Map in the process passes every test you
-- will write and fails the first time you run two instances.
CREATE UNIQUE INDEX IF NOT EXISTS refunds_by_key
  ON refunds (idempotency_key);

CREATE TABLE IF NOT EXISTS stock (
  sku      TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  on_hand  INTEGER NOT NULL,
  restock  TEXT
);

CREATE TABLE IF NOT EXISTS workshop_slots (
  slot_id  TEXT PRIMARY KEY,
  starts   TEXT NOT NULL,
  taken    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workshop_bookings (
  reference    TEXT PRIMARY KEY,
  slot_id      TEXT NOT NULL,
  customer_id  TEXT NOT NULL,
  job          TEXT NOT NULL,
  status       TEXT NOT NULL,
  booked_for   TEXT NOT NULL,
  waiting_days INTEGER NOT NULL DEFAULT 0,
  part         TEXT NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_by_slot
  ON workshop_bookings (slot_id);
`;

export function db(): DatabaseSync {
  if (handle !== undefined) return handle;

  if (DB_PATH !== ":memory:") mkdirSync(dirname(DB_PATH), { recursive: true });
  handle = new DatabaseSync(DB_PATH);
  handle.exec("PRAGMA journal_mode = WAL;");
  handle.exec(SCHEMA);
  return handle;
}

/** True when the shop's data has not been put in yet. */
export function isEmpty(): boolean {
  const row = db().prepare("SELECT COUNT(*) AS n FROM orders").get() as {
    n: number;
  };
  return row.n === 0;
}
