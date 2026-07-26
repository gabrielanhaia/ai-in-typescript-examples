// NOT A LISTING FROM THE BOOK.
//
// Chapter 11's "Run the pair", as one command. It spawns `ch11/server.ts` as
// a child process over stdio, negotiates, discovers, converts, admits and
// calls — and then does the two things the chapter tells you to cause on
// purpose. Nothing here reaches the network and nothing needs a key.
//
//   npm run run-example -- ch11
import {
  LATEST_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "@modelcontextprotocol/sdk/types.js";
import { admit } from "./admit.js";
import { connect } from "./connect.js";
import { asDefinition, registerAll } from "./register.js";

const server = new URL("server.ts", import.meta.url).pathname;
const { client, tools } = await connect(process.execPath, [
  "--import",
  "tsx",
  server,
]);

console.log(`server: ${JSON.stringify(client.getServerVersion())}`);
console.log(
  `capabilities: ${JSON.stringify(client.getServerCapabilities())}`,
);

// A revision is a calendar date and the two ends settle on one during the
// handshake. Take the value from the installed package rather than from a
// published table; where those differ, the code wins, because the code is
// what goes on the wire.
console.log(`latest revision the SDK speaks: ${LATEST_PROTOCOL_VERSION}`);
console.log(`it also speaks: ${SUPPORTED_PROTOCOL_VERSIONS.join(", ")}`);

// A server may supply free text that is not attached to any tool. This one
// does not; a third party's might, and forwarding it unmodified is how a
// sentence somebody else wrote ends up in your prompt.
console.log(`instructions: ${JSON.stringify(client.getInstructions())}`);

const [discovered] = tools;
if (discovered === undefined) throw new Error("the server advertised nothing");

console.log("\n=== discovered, as MCP sends it ===\n");
console.log(JSON.stringify(discovered, null, 2));

console.log("\n=== converted, as it goes on the request ===\n");
const definition = asDefinition("braxby", discovered);
console.log(JSON.stringify(definition, null, 2));

console.log("\n=== the two $schema lines, side by side ===\n");
console.log(
  `  MCP:      ${String((discovered.inputSchema as { $schema?: string }).$schema)}`,
);
console.log(`  provider: ${String(definition.input_schema.$schema)}`);

const admitted = admit([definition], {
  names: ["braxby_get_order_status"],
  maxDescription: 500,
});
console.log(`\nadmitted ${admitted.length} of ${tools.length} discovered`);

const [registered] = registerAll(client, "braxby", tools);
if (registered === undefined) throw new Error("nothing registered");

console.log("\n=== calling it ===\n");
console.log(await registered.invoke({ order_id: "ORD-4471" }));

console.log("\n=== a tool that throws comes back as a result ===\n");
await registered
  .invoke({ order_id: "ORD-9999" })
  .then((text) => console.log(`  resolved: ${text}`))
  .catch((error: unknown) =>
    console.log(`  isError was set, so registerAll threw: ${String(error)}`),
  );

console.log("\n=== so does a tool that does not exist ===\n");
const bogus = await client.callTool({ name: "no_such_tool", arguments: {} });
console.log(`  ${JSON.stringify(bogus)}`);
console.log(
  "  a resolved promise with a flag on it. Code that assumes a bad name\n" +
    "  throws will register a hallucinated tool call as a successful one.",
);

await client.close();
