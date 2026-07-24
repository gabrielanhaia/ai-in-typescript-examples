# Troubleshooting

Start here before opening an issue. This file grows with every real problem a reader reports — if your problem isn't here and you solve it, an issue or PR describing it genuinely helps the next person.

## The example exits immediately with a key error

Your `ANTHROPIC_API_KEY` isn't reaching the process.

- Did you copy `.env.example` to `.env`? The examples read `.env`, not `.env.example`.
- Is the key on one line, with no quotes and no trailing spaces?
- If you're running through Docker, the key is passed by compose from `.env` in the repo root — not from your shell. A key exported in your terminal does **not** reach the container unless compose is told to pass it.

## `docker compose run …` says the service doesn't exist

You're on a version of this repo where that book's examples haven't been published yet. Check the table in the [README](../README.md) — a directory with no `package.json` has no code in it yet.

## It worked last month and now it doesn't

Almost always a dependency moved. Check:

1. `docs/versions.md` — is your installed version the pinned one? `npm ls <package>` will tell you.
2. The repo's open issues — the scheduled workflow opens one automatically when a latest-version run breaks, so the problem may already be documented with a fix.
3. Whether you installed with the lockfile. `npm ci` respects it; `npm install` may not.

If you find a break that isn't already filed, please open an issue with the package, both versions, and the error.

## A model ID is rejected

Model identifiers change as families are released and retired. The examples pin a specific model; if the provider has retired it, the current list is in the provider's own documentation and the fix here is a one-line change. Please open an issue — that's a repo-wide fix, not something each reader should have to work out.

## Rate limits, overloads, and timeouts

Transient provider errors are normal and are not bugs in the examples. Retry with a short backoff. If it persists across several minutes, check the provider's status page before assuming the code is wrong. Book 5 (*AI That Ships*) is the one that treats retries, backoff, and fallbacks properly — earlier examples keep error handling deliberately minimal so the concept being taught stays visible.

## Node version mismatch

The examples target the pinned Node LTS in `docs/versions.md`. Older versions fail in ways that look unrelated to the actual cause — a missing global, a syntax error in a dependency, an ESM resolution failure. Running through Docker sidesteps this entirely, which is why that's the documented path.

## ESM vs CommonJS

These examples are ESM (`"type": "module"`). If you copy one into an existing CommonJS project, `require()` of an ESM-only dependency will fail. Either keep the example's own `package.json` or convert the imports — this is a property of your project, not a defect in the example.

## Docker on Apple Silicon

If an image or native dependency has no `arm64` build, Docker emulates it, and it will be slow rather than broken. If a container fails outright on architecture grounds, please open an issue naming your platform.
