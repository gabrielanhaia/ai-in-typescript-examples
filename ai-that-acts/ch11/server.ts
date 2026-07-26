// PRINTED IN CHAPTER 11 as `ch11/server.ts`.
//
// Use `registerTool`. The older `server.tool()` is deprecated at this pin and
// its parameters are ordered differently, which is the giveaway when you find
// an example written against it.
//
// The handler calls chapter 3's `findOrder` as it stands. Nothing was
// rewritten to publish it; the protocol is a wrapper.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { findOrder } from "../ch03/orders.js";

const server = new McpServer({ name: "braxby-orders", version: "1.0.0" });

server.registerTool(
  "get_order_status",
  {
    description:
      "Look up one Braxby Cycles order by its order number. Returns " +
      "the status and the order total in cents.",
    inputSchema: {
      order_id: z.string().describe("The order number, like ORD-4471."),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ order_id }) => {
    const order = await findOrder(order_id);
    return {
      content: [
        {
          type: "text",
          text:
            `Order ${order.order_id} is ${order.status}. Total ` +
            `${order.total_cents} cents.`,
        },
      ],
    };
  },
);

await server.connect(new StdioServerTransport());
