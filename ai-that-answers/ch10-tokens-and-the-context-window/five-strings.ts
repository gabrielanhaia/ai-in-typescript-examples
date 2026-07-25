import { HumanMessage } from "langchain";
import { countTokens } from "./count.js";

const strings = [
  "cat",
  "internationalisation",
  "550e8400-e29b-41d4-a716-446655440000",
  "Los tokens no son palabras.",
  '{\n  "part": "chain",\n  "qty": 2\n}',
];

for (const s of strings) {
  const n = await countTokens([new HumanMessage(s)]);
  console.log(`${n}\t${s.length} chars\t${JSON.stringify(s)}`);
}
