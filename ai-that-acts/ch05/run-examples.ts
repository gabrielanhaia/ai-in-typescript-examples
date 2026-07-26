// NOT A LISTING FROM THE BOOK.
//
// Chapter 5 is all exports, and its two printed JSON blocks are what the
// model actually receives. This prints both, so you can read them against the
// page. No key, no network.
import { z } from "zod";
import { findOrders } from "./surface.js";
import { manageOrder } from "./god-tool.js";
import { digest } from "./digest.js";
import { findOrdersFor } from "../ch03/orders.js";

console.log("=== find_orders, as the model receives it ===\n");
console.log(JSON.stringify(findOrders.definition.input_schema, null, 2));

console.log("\n=== the god tool's payload field ===\n");
const emitted = z.toJSONSchema(manageOrder) as {
  properties: Record<string, unknown>;
};
console.log(JSON.stringify(emitted.properties["payload"], null, 2));

console.log("\n=== what a tool result looks like ===\n");
console.log(await findOrders.invoke({ email: "rowan.pike@example.com" }));

console.log("\n=== and when there is nothing to find ===\n");
console.log(digest(await findOrdersFor("nobody@example.com", undefined, 6),
  "nobody@example.com", 5));
