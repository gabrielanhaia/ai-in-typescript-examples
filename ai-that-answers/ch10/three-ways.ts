import { HumanMessage } from "langchain";
import { readFile } from "node:fs/promises";
import { countTokens } from "./count.js";

const samples = ["prose.txt", "data.json", "code.ts"];

for (const name of samples) {
  // The book prints readFile(`ch10/samples/${name}`); resolving against
  // import.meta.url means the script does not care where you started it from.
  const text = await readFile(new URL(`samples/${name}`, import.meta.url), "utf8");
  const tokens = await countTokens([new HumanMessage(text)]);
  console.log(
    `${name.padEnd(12)} ${text.length} chars  ` +
      `${tokens} tokens  ${(text.length / tokens).toFixed(2)} chars/token`,
  );
}
