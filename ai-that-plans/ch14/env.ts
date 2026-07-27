// NOT A LISTING FROM THE BOOK.
//
// One line of glue about this repository rather than about the chapter, and
// the reason it is its own module instead of two lines at the top of
// `build.ts` is that `ch14/build.ts` is printed on the page and reads
// `process.env.DATABASE_URL` in its first statement. Nothing may be added
// above that line, so the assignment has to happen in a module that is
// evaluated first — which is what an import placed before `./build.js` gets
// you, because ES modules are evaluated in the order their imports appear.
//
// `DATABASE_URL` is the right name in an application that owns its own
// database. Here it is already taken: Book 2 (ai-that-reads) publishes a
// Postgres on 5432 under that name and the repository-root `.env.example`
// sets it. Book 4's own container publishes on 5433 under
// PLANS_DATABASE_URL, so that name wins here and the printed line in
// `build.ts` is left exactly as the page has it.
//
// Every entry point that can reach `build.ts` imports this first:
// `hub.ts`, `events.ts`, `server.ts` and `setup-db.ts`.
process.env.DATABASE_URL =
  process.env.PLANS_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://braxby:braxby@localhost:5433/braxby";

// The same trick, for the other credential. Building the assistant
// constructs two chat models at module scope — Opus in `plan.ts`,
// Sonnet in `parts.ts` — and the SDK's own failure for a missing key
// is a stack trace inside node_modules. Anything that imports
// `build.ts` needs a key, including `setup-db.ts`, which imports it
// for the two objects whose tables it creates.
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY is not set. ch14 plans with claude-opus-5 and " +
      "delegates to claude-sonnet-5, so building the assistant needs a " +
      "key. Put one in ../.env or ./.env. Nothing in ch14/run-examples.ts " +
      "or the two test files needs one.",
  );
}
