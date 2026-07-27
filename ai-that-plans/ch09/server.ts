// ch09/server.ts
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { startRun } from "./hub.js";
import { events } from "./events.js";

const page = readFileSync(
  new URL("./public/index.html", import.meta.url),
);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:8787");

  if (url.pathname === "/runs" && req.method === "POST") {
    const thread = randomUUID();
    // Not awaited. Finishing the run is not this request's job.
    void startRun(thread, url.searchParams.get("q") ?? "");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ thread }));
    return;
  }

  if (url.pathname === "/events") {
    await events(req, res, url.searchParams.get("thread") ?? "");
    return;
  }

  res.writeHead(200, { "content-type": "text/html" });
  res.end(page);
}).listen(8787);
