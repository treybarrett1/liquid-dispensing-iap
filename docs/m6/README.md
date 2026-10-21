# M6 — Test effectiveness through deliberate fault injection

**IAP repository:** https://github.com/treybarrett1/liquid-dispensing-iap

**Existing M5 slice, unchanged:** browser to HTTP, target validation, durable
SQLite run-history row, and committed readback. This does not test a real
pump, sensor, or ESP32 firmware. Existing Playwright tests still verify the
browser and actual process restart.

## What M6 adds

- `test/m6/acceptance.test.mjs`: runs the **built, real M5 server**
  against a **real temporary SQLite file**, sends real HTTP requests, then
  queries the database independently. Includes exactly-full 120 mL against
  120 mL capacity (allowed), overflow 120.01 mL (rejected without insert),
  and cancellation committed. Another acceptance test terminates and
  restarts the actual process to demonstrate one-time recovery.
- `test/m6/logic.test.mjs`: behavioral tests of exact-boundary intake,
  fractional volumes, invalid data, SQLite persistence, cancellation,
  idempotent restart recovery, role-independent record identity, write
  failure rollback, and calculator behavior. No implementation mocks.
- `npm run test:m6`: Node 24's built-in `node:test` and V8
  `--experimental-test-coverage` report over the actual `src/*.js`
  files, without third-party coverage dependencies or alterations to
  the npm lockfile.
- `.github/workflows/m6-testing.yml`: reproducible CI run of existing
  Vitest regression tests, the M6 acceptance/unit suite and coverage,
  and existing Playwright browser tests. Raw report artifacts are uploaded
  for 90 days.

### Locally reproducible commands (Node.js 24)

```sh
npm ci
npm run build
npm test
npm run test:m6
npx playwright install chromium
npm run test:e2e
```

## Deliberate injected fault — wait for observed output

Fault is **one character** in `src/run-history.js`:

```diff
-  if (targetMl > usableCapacityMl) {
+  if (targetMl >= usableCapacityMl) {
```

The wrong condition rejects the valid exact-capacity boundary. Both a pure
unit test and a real HTTP-to-SQLite acceptance test require a 201 success on
this boundary and should catch it.

Document the **actual** clean baseline, injected failure, and restored green
CI outputs with exact commit IDs and GitHub Actions run URLs. No anticipated
result should be misrepresented as an executed test.
