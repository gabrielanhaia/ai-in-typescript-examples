// Not a listing from the book: a driver so the chapter's pure functions can be
// run and their output shown. No model, no API key, and the output is identical
// on every machine — which is the chapter's whole argument.
import { totalPence } from "./total.js";
import { isPartNumber } from "./part-number.js";
import { ownerOf } from "./route.js";
import { shippingPence } from "./shipping.js";
import { checkedPart } from "./verify.js";
import { verifiedSpan } from "./spans.js";

console.log(
  "totalPence      ",
  totalPence([
    { pence: 399, qty: 2 },
    { pence: 1_250, qty: 1 },
  ]),
);

console.log("isPartNumber    ", isPartNumber("BRK-1180"), isPartNumber("brk-118"));
console.log("ownerOf         ", ownerOf("checkout"));
console.log("shippingPence   ", shippingPence(500), shippingPence(5_000), shippingPence(20_000));
console.log("checkedPart     ", checkedPart("BRK-1180"), checkedPart("BRK-9999"));

const source = "The Manchester   workshop closes on 14 August for stock-taking.";
console.log("verifiedSpan    ", verifiedSpan(source, "closes on 14 august"));
console.log("verifiedSpan    ", verifiedSpan(source, "closes on 15 August"));
