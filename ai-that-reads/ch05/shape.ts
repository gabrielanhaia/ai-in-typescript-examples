// ch05/shape.ts
import { embedPassages } from "../ch02/embed.js";

const [vector] = await embedPassages([
  "The workshop is open from nine on weekdays.",
]);

console.log(vector.length);
console.log(vector.slice(0, 5));
