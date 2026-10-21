# M6 — Test effectiveness through deliberately injected bug

**Individual App Project (IAP):** liquid dispensing run-history walking skeleton.
**Evidence index:** [SUBMISSION.md](SUBMISSION.md).
**Scope:** the real, committed M5 desktop browser -> HTTP -> validation ->
SQLite persistence -> readback/restart boundary, not yet the physical
ESP32, pump, or sensor controls.

## Implementation and test commands (Node.js 24)

```sh
npm ci
npm run build
npm test
npm run test:m6
npx playwright install chromium
npm run test:e2e
```

- `test/m6/acceptance.test.mjs` launches the built HTTP server in
  child processes, submits real requests to SQLite, checks the exact
  persisted row directly, and tests restart and cancellation.
- `test/m6/logic.test.mjs` tests input behavior, exact bottle-capacity
  equality, near-boundary overflow, invalid values, idempotent
  cancellation/recovery, durable row IDs and calculator results.
- Existing M5 Playwright browser tests and Vitest tests remain intact.
- `npm run test:m6` invokes Node.js 24's native test runner with
  V8 source coverage, scoped to imported `src/*.js` modules; no
  dependency installation beyond the existing `npm ci` is needed.
- `.github/workflows/m6-testing.yml` runs all three suites and publishes
  raw output, source coverage, and browser artifacts.

## Verified clean -> break -> fix sequence

| Phase | Commit | Tests in M6 suite | CI |
| --- | --- | --- | --- |
| Clean | [c76613b](https://github.com/treybarrett1/liquid-dispensing-iap/commit/c76613bdd453dbc497d89cf485ba046561dad4f9) | 27 pass, 0 fail | [Green 39696050680](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696050680) |
| One-character fault | [13ee920](https://github.com/treybarrett1/liquid-dispensing-iap/commit/13ee920b3490e4823ad65754ab38e639231ca9fe) | 24 pass, 3 fail | [Red 39696150480](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696150480) |
| Restored | [d469674](https://github.com/treybarrett1/liquid-dispensing-iap/commit/d469674f0bfeeb72e6d9a19617456cf9a290e50e) | 27 pass, 0 fail | [Green 39696222298](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696222298) |

The *observed* fault was changing `targetMl > usableCapacityMl` to
`targetMl >= usableCapacityMl` in `src/run-history.js`. This rejects
a valid, exactly full 120 mL / 120 mL target, the error a user would
notice. The existing HTTP acceptance test then received 400 instead of
201, while two independent logic/persistence tests failed as well. Tests
were **unchanged** across the fault and restoration.

V8 measured **98.41% line, 98.08% branch, and 100.00% function
coverage** over executed non-server `src/*.js` modules. The server
executes from the built `dist/server.js` and is verified functionally
by HTTP and browser acceptance tests, but server source is **not**
included in the V8 source coverage denominator. Coverage percentages
do not claim to cover planned physical firmware and hardware functions.

For complete submission artifacts see [SUBMISSION.md](SUBMISSION.md)
and [the prompt-and-diff log](PROMPT_AND_DIFF_LOG.md).
