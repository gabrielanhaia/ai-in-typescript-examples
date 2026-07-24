# Versions

Every dependency in this repo is pinned to an **exact** version. No `^`, no `~`, no `latest`.

This file is the record of what is pinned, why it is pinned there, and when it was last verified against the real world. It is the reason a reader who picks up a book six months after publication can still run the code.

## The rule

1. **Exact pins only.** A range makes the repo unreproducible and turns a reader's first five minutes into a debugging session.
2. **Every pin has a reason and a date.** "Latest at the time" is a valid reason; an undated pin is not.
3. **Verified twice per book** — once while the book is drafted, once at its fact-check pass — and re-verified whenever CI reports a break.
4. **A pin is only changed deliberately**, with the change noted in the changelog below. Silent bumps are how a repo stops matching the printed book.

## Pinned versions

Pins land here as each book's examples are published — the first set arrives with **AI That Answers**. Nothing is listed yet because no example code has been published, and listing versions that no code actually uses would be a lie the first reader would catch.

The table each book fills in:

| Package | Pinned | Why | Last verified | Used by |
|---|---|---|---|---|

## Runtime

| Component | Pinned | Why | Last verified |
|---|---|---|---|

The runtime row set (Node.js LTS, TypeScript, the base container image) is filled in with the first published example and is shared by all five books unless a book states otherwise.

## Scheduled verification

`.github/workflows/verify.yml` runs on a schedule and on demand. For every book directory that has a `package.json`, it:

- installs and runs the examples **against the pinned versions** — this must always pass, and a failure means the repo is broken for readers today;
- installs and runs them **against latest** — this is allowed to fail, and when it does the workflow opens an issue naming the package and the error.

That second job is the early-warning system for framework churn. When it fires: fix the repo immediately, record the new pin here with today's date, and note it for the book's next edition.

## Changelog

Changes to a pin go here, newest first — date, what moved, from what to what, and why.

*(No entries yet — the first arrives with the first published example.)*
