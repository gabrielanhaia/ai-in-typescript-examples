import { StringDecoder } from "node:string_decoder";

const bytes = Buffer.from("café", "utf8");
const a = bytes.subarray(0, 4);   // splits the é in half
const b = bytes.subarray(4);

console.log(a.toString("utf8") + b.toString("utf8"));  // caf��

const decoder = new StringDecoder("utf8");
console.log(decoder.write(a) + decoder.write(b) + decoder.end());  // café
