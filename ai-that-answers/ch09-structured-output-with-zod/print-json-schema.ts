// Stage one of withStructuredOutput: your Zod schema becomes JSON Schema. This
// is what the provider actually receives, and it is worth printing once.
import { z } from "zod";
import { Triage } from "./schema.js";

console.log(JSON.stringify(z.toJSONSchema(Triage), null, 2));
