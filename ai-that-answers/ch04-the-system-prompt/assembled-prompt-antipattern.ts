// The anti-pattern, kept runnable so you can see what it produces. Building a
// system prompt out of pieces gives you a prompt nobody has ever read end to
// end: with four two-way switches there are sixteen of them. Run it and count.
const BASE_RULES = "Answer only from this conversation. Never state a price.";
const PRO_RULES = "Pro customers may ask for fitment tables.";
const FREE_RULES = "Point free customers at the product page for detail.";
const GERMAN_TONE = "Antworte auf Deutsch, sachlich und knapp.";
const ENGLISH_TONE = "Answer in English, plainly and briefly.";
const REFUSAL_V1 = "If you cannot help, say so in one sentence.";
const REFUSAL_V2 = "If you cannot help, say so and offer a human.";

// Read from the environment so the switches are genuinely switches: the whole
// problem is that nobody can point at the prompt this code will actually send.
const tier = process.env.TIER === "free" ? "free" : "pro";
const locale = process.env.LOCALE === "de" ? "de" : "en";
const featureFlags = { newRefusal: process.env.REFUSAL_V2 !== "0" };

// Do not do this.
const system = [
  BASE_RULES,
  tier === "pro" ? PRO_RULES : FREE_RULES,
  locale === "de" ? GERMAN_TONE : ENGLISH_TONE,
  featureFlags.newRefusal ? REFUSAL_V2 : REFUSAL_V1,
].join("\n\n");

console.log(system);
console.log(`\n[this is 1 of ${2 * 2 * 2} prompts this code can emit]`);
