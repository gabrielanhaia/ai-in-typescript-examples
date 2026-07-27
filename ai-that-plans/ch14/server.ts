// ch14/server.ts
//
// Chapter 14 prints ONE block of this file — nine lines, the `/decide` route,
// under the header "ch14/server.ts, the route chapter 9 did not have". They
// are below, verbatim, at the indentation the handler gives them; the page
// shows them flush left because it is an excerpt.
//
// Everything around them is chapter 9's `ch09/server.ts`, carried forward
// with the two edits this build forces: `startRun(thread, text)` becomes
// `drive(thread, input)`, and the first invoke carries a `customerId`, which
// ch14's state requires and chapter 9's did not have.
//
// `./env.js` is imported before anything that reaches `./build.js`.
import "./env.js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage } from "node:http";
import { Command } from "@langchain/langgraph";
import type { Decision } from "./approval.js";
import { events } from "./events.js";
import { drive } from "./hub.js";

const page = readFileSync(
  new URL("./public/index.html", import.meta.url),
);

/** The body of a POST, as text. Chapter 9's routes took their
 *  arguments from the query string and never needed one. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:8787");
  // Every route except POST /runs works on a thread that already
  // exists, and they all name it the same way.
  const thread = url.searchParams.get("thread") ?? "";

  if (url.pathname === "/runs" && req.method === "POST") {
    const started = randomUUID();
    // `cust-4417`, not chapter 7's `cust_4417`. `PostgresStore`
    // rejects a namespace label containing `_` or `%` outright,
    // because those are SQL LIKE wildcards and would make a prefix
    // search match namespaces outside the prefix. Chapter 7 never
    // met this: an InMemoryStore has no opinion about underscores.
    // It surfaces from the store's own batch queue rather than from
    // the run, so it takes the process down instead of arriving as
    // a `failed` frame.
    //
    // Not awaited. Finishing the run is not this request's job.
    void drive(started, {
      messages: [
        { role: "user", content: url.searchParams.get("q") ?? "" },
      ],
      customerId: url.searchParams.get("customer") ?? "cust-4417",
    });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ thread: started }));
    return;
  }

  if (url.pathname === "/events") {
    await events(req, res, thread);
    return;
  }

  // ch14/server.ts, the route chapter 9 did not have
  if (url.pathname === "/decide" && req.method === "POST") {
    const decision = JSON.parse(await readBody(req)) as Decision;
    // Same function as a fresh run. A Command instead of a first
    // message is the only difference the graph can see.
    void drive(thread, new Command({ resume: decision }));
    res.writeHead(202).end();
    return;
  }

  res.writeHead(200, { "content-type": "text/html" });
  res.end(page);
}).listen(8787);

console.log("http://127.0.0.1:8787");
