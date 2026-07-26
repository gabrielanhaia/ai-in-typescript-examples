// PRINTED IN CHAPTER 11 as `ch11/connect.ts`.
//
// The whole of the protocol work. The constructor says who is calling,
// `connect` runs the negotiation, and `listTools` answers with a `tools`
// array.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

export async function connect(command: string, args: string[]) {
  const client = new Client({
    name: "braxby-assistant",
    version: "1.0.0",
  });
  await client.connect(new StdioClientTransport({ command, args }));

  const { tools } = await client.listTools();
  return { client, tools };
}
