# M6 prompt-and-diff log — Liquid Dispensing IAP

**Date:** October 21, 2026, America/Chicago.
**AI assistant:** OpenAI ChatGPT, GPT-6.
**Project/repo:** https://github.com/treybarrett1/liquid-dispensing-iap
**Branch:** `test/m6-coverage-bug-injection`
**Tested M5:** Browser -> HTTP -> run-history rules -> actual SQLite
file -> record readback, cancellation, and restart recovery.

## Verbatim relevant prompts (in sequence)

> Evidence to submit
>
> Test run output.
> Coverage report.
> Bug-injection evidence in three parts: the fault diff, the suite failing on it, and the fix restoring green.
> Prompt-and-diff log.
> Stack-neutral: any language, any test runner.
>
> Rubric
>
> Criterion
>
> Pts
>
> Acceptance test exercises the thin slice at its real boundary
>
> 4
>
> Unit tests assert behaviour rather than restating implementation
>
> 4
>
> Coverage report submitted
>
> 2
>
> Injected fault is subtle enough to be a real test of the suite
>
> 4
>
> All three bug-injection artifacts present: diff, failure, fix
>
> 4
>
> Prompt-and-diff log present
>
> 2

> Write tests for your app, then prove they would actually catch something.
>
> Coverage numbers are easy to manufacture and tell you almost nothing about whether a suite works. The bug-injection demonstration is the honest version of the question: break your own code on purpose and show the suite noticing.
>
> What to do
>
> Write an acceptance test for the thin slice from M5.
> Write unit tests for the logic underneath it.
> Generate a coverage report.
> Inject a fault: change one line of working code so it is wrong in a way a user would care about. Run the suite. Show it failing. Then revert and show it passing.
> Choose the injected fault carefully. Deleting a whole function proves nothing — any suite catches that. An off-by-one, an inverted condition, or a dropped edge case is the interesting test of your tests. If your suite does not catch your first injected fault, that is a genuine finding: report it, then write the test that would have caught it.

Later user corrections and final direction, verbatim:

> this is for my individual project not the team project.

> the IAP

> Did you do the iap m6

> I have fixed the team repo issue. Just complete the m6 assignment and push to my iap repo

## Files generated/changed for M6

- `test/m6/logic.test.mjs`: created behavior-based tests for
  exact-capacity boundary, near-overflow, invalid values, durability,
  cancellation/recovery, idempotency, and flow calculations.
- `test/m6/acceptance.test.mjs`: created tests against real built
  server and actual HTTP, temp SQLite, persisted row readback,
  cancellation, and real process restarts.
- `package.json`: added `test:m6` using Node's built-in V8
  source coverage (no new dependencies).
- `.github/workflows/m6-testing.yml`: created CI job executing
  production build, existing Vitest tests, M6 tests/coverage, existing
  Chromium Playwright acceptance, artifact upload.
- `docs/m6/README.md`, `docs/m6/SUBMISSION.md`,
  `docs/m6/evidence/*`, and this document: reproducible submission
  and actual clean/red/fix evidence.
- `AI_LOG.md`: indexed this assistance.

## Human/AI decisions and corrections

- The assistant initially worked on the *wrong* EECE 4081 team repo.
  The user corrected the target to this IAP; this session's submission
  evidence explicitly covers this repository only. Prior team repo
  test results have **not** been used as IAP evidence.
- The initial M6 branch run uncovered a test-harness discrepancy:
  Node's `node:sqlite` row objects have a null prototype. Two deep
  equality tests incorrectly failed despite matching field values.
  The assistant modified only the M6 acceptance test harness to
  normalize each SQLite row via `({ ...row })` before assertions.
  Initial non-green run:
  https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39695972929
- The clean run after this correction passed 27/27 M6 tests,
  23/23 Vitest and 2/2 Playwright:
  https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696050680
- **Fault injected:** in `src/run-history.js` change the one
  character `>` to `>=`. Fault commit
  `13ee920b3490e4823ad65754ab38e639231ca9fe`.
- **Observed on broken production code:** 24/27 M6 tests pass;
  exactly three fail, including real HTTP acceptance reporting
  400 rather than 201:
  https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696150480
- **Restoration:** revert `>=` to `>` in
  `src/run-history.js`. Restoring commit
  `d469674f0bfeeb72e6d9a19617456cf9a290e50e`.
  Re-run: 27/27 M6, 23/23 Vitest, and 2/2 browser tests green:
  https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696222298
- **Coverage:** Node 24 V8 report of the four imported application
  logic modules: 98.41% lines / 98.08% branches / 100% functions.
  The built HTTP server's source is not included in this percentage;
  hardware/firmware is not tested.
- Tests were not edited during the intentional fault and restoration.

## Exact fault and fix diffs

Injected:

```diff
-  if (targetMl > usableCapacityMl) {
+  if (targetMl >= usableCapacityMl) {
```

Restored:

```diff
-  if (targetMl >= usableCapacityMl) {
+  if (targetMl > usableCapacityMl) {
```

## Evidence review

Raw reports are available as GitHub Actions artifacts at each run URL;
the repository includes abbreviated log excerpts and the precise
one-character fault/fix diffs. CI exercises a desktop-only M5 slice.
Physical pump/sensor operation and a course-site submission are not
claimed. Human inspection of the actual fault and outcome is encouraged.
