// NOT A LISTING FROM THE BOOK.
//
// The Braxby Cycles service the tools in this book call. It holds invented
// data in a SQLite file, it binds to localhost, and it is the only thing any
// write in this book can reach.
//
//   docker compose up -d      (in ai-that-acts/)
//   npm run app               (or on your own Node)
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PORT } from "./config.js";
import { orders } from "./orders/routes.js";
import { refunds } from "./refunds/routes.js";
import { stock } from "./stock/routes.js";
import { workshop } from "./workshop/routes.js";
import { seed } from "./seed.js";

seed();

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "braxby" }));

// The loop sends a run identifier and an actor header. Echoing both into this
// log means one identifier joins the two sides without matching timestamps.
app.use("*", async (c, next) => {
  const started = Date.now();
  await next();
  const run = c.req.header("x-braxby-run") ?? "-";
  const actor = c.req.header("x-braxby-actor") ?? "-";
  console.log(
    `${c.req.method} ${c.req.path} ${c.res.status} ` +
      `run=${run} actor=${actor} ms=${Date.now() - started}`,
  );
});

app.route("/", orders);
app.route("/", refunds);
app.route("/", stock);
app.route("/", workshop);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`braxby listening on http://localhost:${info.port}`);
});
