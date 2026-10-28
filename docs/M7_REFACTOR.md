# M7 — Behavior-preserving refactor (Charles Barrett)

## Code smell and change
The `validateTarget` function in `src/run-history.js` combined input-object validation, a loop implementing a repeated positive-finite-number rule, and the cross-field capacity rule. The numeric rule was extracted into `requirePositiveFinite(label, value)`, with explicit calls for target and usable capacity. This separates field validation from cross-field validation and makes future changes to numeric constraints easier to locate. The error strings, order of checks, returned values, and public interface were kept unchanged.

## Diff
Compare `main...m7-refactor` at https://github.com/treybarrett1/liquid-dispensing-iap/compare/main...m7-refactor . Refactored file: `src/run-history.js`. No tests were edited.

## Test evidence — not yet verified
The same test commands **must be run on both revisions** using Node 24; the connected GitHub file API cannot execute tests, and the available execution environment could not reach GitHub to clone the repository. Do not claim a passing result until the logs are captured.

Run on the original revision, then on `m7-refactor` with unchanged test files:

```sh
npm ci
npm run build
npm test
npm run test:m6
```

Record command output for both revisions as `docs/m7/before-tests.txt` and `docs/m7/after-tests.txt` (including build output). If any test fails, investigate and do not label this behavior-preserving.

## Prompt-and-diff log
**Prompt:** “Improve the internal structure of your app without changing what it does, and prove that is what happened.”

**AI assistance:** Reviewed the existing `RunHistory` domain validation and M6 acceptance test source. Identified mixed responsibilities in `validateTarget`. Proposed and applied a helper extraction, retaining the original input checks, messages, order, and capacity comparison.

**Diff summary:** Added private `requirePositiveFinite(label, value)`; replaced the two-iteration validation loop with two calls to the helper. Did not alter tests or external APIs.

**Verification limitation:** Source-level equivalence has been reviewed, but before/after passing test output has not been collected. This evidence is outstanding and the assignment is not yet fully demonstrated.
