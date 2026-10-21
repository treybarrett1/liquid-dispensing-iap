# M6 — Individual App Project submission

**Project:** Liquid Dispensing IAP
**Assignment:** Write tests, generate coverage, deliberately inject a
realistic one-line bug, show red, revert and show green.
**Date:** October 21, 2026 (America/Chicago).
**Repository:** https://github.com/treybarrett1/liquid-dispensing-iap

## Evidence inventory / rubric mapping (20 possible points)

| Rubric criterion | Points | Submitted evidence |
| --- | ---: | --- |
| Acceptance test exercises real M5 boundary | 4 | [M6 HTTP + SQLite acceptance](../../test/m6/acceptance.test.mjs); existing [browser + SQLite + real restart acceptance](../../test/e2e/walking-skeleton.spec.js). No mocked server or mock database. |
| Behavioral unit tests beneath the slice | 4 | [M6 logic tests](../../test/m6/logic.test.mjs), plus prior [Vitest domain/SQLite tests](../../test/run-history.test.js). Tests assert acceptance/rejection, persistence, history identity, recovery, and error handling. |
| Actual coverage report | 2 | [Measured report](evidence/02-coverage-report.txt) and downloadable [raw CI artifact](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696050680/artifacts/12390384677). |
| Subtle realistic injected fault | 4 | [One-character fault diff](evidence/03-injected-fault.diff); legitimate equality target `120mL/120mL` is rejected. |
| Fault diff, failing suite, restoring fix | 4 | [Fault diff](evidence/03-injected-fault.diff), [failing results](evidence/04-red-test-output.txt), [fix diff](evidence/05-restoration.diff), [restored green output](evidence/06-restored-test-output.txt). |
| Prompt-and-diff log | 2 | [Full prompt/disposition/diff log](PROMPT_AND_DIFF_LOG.md); [AI-use index](../../AI_LOG.md). |

## Actual chronological evidence

**1. Clean baseline** — `c76613bdd453dbc497d89cf485ba046561dad4f9`:
[successful CI run](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696050680)
and [test output](evidence/01-clean-test-output.txt).
The new M6 suite passed 27/27 tests; existing Vitest passed 23/23,
existing Playwright passed 2/2. V8 reported 98.41% line, 98.08% branch,
100% function coverage of four directly exercised source modules.

**2. Injected one-line fault** —
`13ee920b3490e4823ad65754ab38e639231ca9fe`:
[fault commit](https://github.com/treybarrett1/liquid-dispensing-iap/commit/13ee920b3490e4823ad65754ab38e639231ca9fe),
[failed CI run](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696150480).
New M6 suite reported **24 passed and 3 failed**. The HTTP acceptance
test observed a 400 instead of 201 on exactly-full input; independent
unit and persisted-record tests also rejected the valid input.
Existing Vitest suite passed; browser step was skipped because CI
correctly stopped at the failed M6 gate. See [failure log](evidence/04-red-test-output.txt).

**3. Restored original conditional** —
`d469674f0bfeeb72e6d9a19617456cf9a290e50e`:
[fix commit](https://github.com/treybarrett1/liquid-dispensing-iap/commit/d469674f0bfeeb72e6d9a19617456cf9a290e50e),
[successful CI run](https://github.com/treybarrett1/liquid-dispensing-iap/actions/runs/39696222298).
**27/27 M6, 23/23 existing Vitest, 2/2 existing Playwright tests all green**.
No test changes were made during fault injection or restoration.
See [restored output](evidence/06-restored-test-output.txt).

## Coverage interpretation

Coverage is collected using Node's built-in
`--experimental-test-coverage --test-coverage-include=src/*.js`.
It measures imported `src/dispensing.js`, `src/volume.js`,
`src/run-history.js`, and `src/sqlite-history.js`. The built
`dist/server.js` boundary was exercised independently by real HTTP
and browser acceptance tests, but its source is excluded from this
coverage denominator. Future ESP32, pump, touchscreen and sensor code
is not part of this M5 desktop walking skeleton. This is **not**
a claim of 98% coverage over the whole final embedded system.

## Reproduction

Use Node.js 24 and `npm ci && npm run build && npm test && npm run test:m6`.
For existing browser acceptance run `npx playwright install chromium`
then `npm run test:e2e`. The CI workflow installs dependencies and
collects full raw reports from every branch push and pull request.
All test databases use disposable temporary paths; the production
`data/dispenser.sqlite` is untouched.

No course-site submission is claimed by this document.
