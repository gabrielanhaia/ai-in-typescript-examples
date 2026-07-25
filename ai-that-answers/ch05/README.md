# ch05 — Sampling: temperature, top-p, and the word "deterministic"

Two experiments. The first shows that `temperature: 0` narrows variation and does
not eliminate it. The second shows that on newer models the parameter is gone.

**Every test in this directory calls the model**, so it is excluded from
`npm run verify` and lives in `npm run test:live` instead. It is the only such
directory in the book.

## Run it

```bash
docker compose run ai-that-answers ch05
docker compose run ai-that-answers ch05/sampling-support
```

Locally, from `ai-that-answers/`:

```bash
npm run run-example -- ch05
npm run test:live                 # both live tests, a few tokens each
```

| File | What it does | Needs a key |
|---|---|---|
| `repeatability.ts` | 10 calls at `temperature: 0`, 10 at `1`, counts distinct answers. The chapter default. | yes |
| `sampling-support.ts` | Probes three models with `temperature: 0` and prints what each one does. | yes |
| `sampling-support.test.ts` | The probe kept as a test: one cheap call, asserting the shipped config is accepted. | yes |
| `classify.ts`, `classify.test.ts` | The smallest complete `classify()` the chapter's two assertion listings need. | yes |

## Expected output

`repeatability.ts` takes about thirty seconds and prints two blocks:

```
temperature 0: 2 distinct / 10
  - Steel frames absorb road vibration better than aluminium.
  - Steel is more durable and can usually be repaired after damage.
temperature 1: 7 distinct / 10
  - ...
```

**Your counts will differ, and that is the point.** What to look for is the
relationship: temperature 1 should be higher than temperature 0, and temperature
0 should not reliably be 1. If you get ten identical answers at 0 on the first
run, run it again a few times — "stable this afternoon" and "deterministic" are
different claims.

`sampling-support.ts` prints three lines, and — at the pinned versions — three
different behaviours:

```
claude-haiku-4-5: temperature accepted
claude-sonnet-5: rejected -> 400 <the API's message>
claude-opus-5: rejected -> temperature is not supported for claude-opus-5 when set to non-default values
```

Three models, three behaviours. Haiku's request succeeds. Sonnet's leaves your
process and comes back a 400 — a network round trip you paid for. Opus never
leaves: the binding keeps its own list of models that reject sampling parameters,
and that list has `claude-opus-5` on it and `claude-sonnet-5` not. Same outcome,
two different layers, two different error strings — which is worth knowing when
you are reading a stack trace at speed.
