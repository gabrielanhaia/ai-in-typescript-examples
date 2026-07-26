// The block printed in chapter 3 under "What the model actually sees". The
// chapter prints it without a filename; running it is the single most useful
// debugging move in that chapter, so it is a file.
import { z } from "zod";
import { RefundInput } from "./schema.js";

console.log(JSON.stringify(z.toJSONSchema(RefundInput), null, 2));
