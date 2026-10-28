# M7 — Behavior-preserving refactor (Charles Barrett)

Verified on October 28, 2026 using Node.js **v24.18.0** and npm **11.16.0** on Windows x64. The original and refactored revisions both build and pass the same **23 Vitest tests and 27 M6 tests**, with no changes to any tests, dependency versions, or test commands.

## Revisions and scope

- Repository: https://github.com/treybarrett1/liquid-dispensing-iap
- Original main: `05a1b79a80f189ebf49f12e313406ce18618f32e` (also the merge base).
- Refactoring commit: `b5aedbde1d6b9a2a495bffd69fbcaa3b37a46698`.
- Tested `m7-refactor`: `fa0a51d0fdbda5a6f39983ad7956a17cb93a2ec6`.
- The evidence completion commit adds documentation and evidence tooling only; runtime source remains exactly the tested refactor.

An isolated Git worktree was checked out at original main, tested, then switched to `m7-refactor` and tested again. Existing uncommitted work in the original local checkout was preserved. Publication is limited to this personal repository's `m7-refactor` branch; the team repository and remote main are outside the write scope.

## Code smell and refactoring explanation

`validateTarget` mixed three responsibilities: checking the input object's shape, implementing a reusable positive-finite-number rule inline, and comparing target volume with usable capacity. Its loop combined the numeric predicate and error construction with cross-field orchestration. This is a small case of mixed validation responsibilities and an embedded rule that is harder to name and reuse; it is not a claim that the original function was a large function or contained multiple copied blocks.

The **Extract Function** refactor introduces private `requirePositiveFinite(label, value)` and replaces the loop with two explicit calls. The helper owns the numeric predicate and field-specific error. `validateTarget` retains input-shape validation, field-validation order, the capacity comparison, and the returned object. Naming the rule makes the validation sequence easier to read while keeping the public API unchanged.

Only `src/run-history.js` changes at runtime: eight lines added and five removed. The helper remains unexported. No persistence, HTTP, UI, or hardware behavior changes.

## Behavior-preservation review

| Observable contract | Before and after |
| --- | --- |
| Malformed input | The same falsy/non-object/array guard throws `DomainError('Enter a target and usable bottle capacity.')`. |
| Property access and validation order | Both fields are destructured first; target is checked before usable capacity. If both are invalid, target's error wins. |
| Numeric validity | Identical `typeof value !== 'number'`, `!Number.isFinite(value)`, and `value <= 0` predicate; no coercion or rounding. |
| Errors | Same `DomainError` type, default status 400, and exact `${label} must be a finite number greater than zero.` message. |
| Capacity boundary | The unchanged `targetMl > usableCapacityMl` comparison accepts equality and rejects overflow. |
| Success result | Returns the same `{ targetMl, usableCapacityMl }` values. |
| Downstream operations | Existing tests verify pending-record creation, rejection without writes, cancellation, restart recovery, rollback, real HTTP responses, and SQLite persistence. |

The source comparison and passing unchanged tests support behavior preservation for the application's contract and tested paths. Tests are not an exhaustive proof over all possible JavaScript inputs; private stack-frame layout changes with helper extraction.

## Actual before-and-after results

Both revisions ran these exact commands, in this order:

```sh
npm ci
npm run build
npm test
npm run test:m6
```

| Command | Original main | Refactored branch |
| --- | --- | --- |
| `npm ci` | Exit 0; 54 packages installed | Exit 0; 54 packages installed |
| `npm run build` | Exit 0; production server/browser assets built | Exit 0; production server/browser assets built |
| `npm test` | Exit 0; 2 files, 23/23 tests passed | Exit 0; 2 files, 23/23 tests passed |
| `npm run test:m6` | Exit 0; 27/27 passed, 0 failed/skipped/cancelled/todo | Exit 0; 27/27 passed, 0 failed/skipped/cancelled/todo |

- [Original complete output](m7/before-tests.txt): 19:06:12–19:06:25 UTC.
- [Refactored complete output](m7/after-tests.txt): 19:06:38–19:06:43 UTC.
- [Automated evidence consistency report](m7/verification.txt).

Logs include exact revision, Node/npm versions, timestamps, complete stdout and stderr per command, exit codes, and SHA-256 hashes. All nine input hashes match across runs: five test files, build script, both package files, and Playwright configuration. Git comparison independently confirms unchanged tests, scripts, web files, dependency manifests, and workflows. All 27 M6 test names and both Vitest file/count entries match. No assertion was weakened, test skipped, or test modified.

No build or test failed, so no production fix or rerun was necessary. Both installs reported the same existing **five dependency vulnerabilities (one moderate, two high, two critical)** and an esbuild install-script approval warning; exit status was zero and builds succeeded. These warnings are retained verbatim. Dependencies were not upgraded as part of this behavior-preserving refactor.

### Measured coverage

| Scope | Original line / branch / function | Refactored line / branch / function |
| --- | --- | --- |
| `src/run-history.js` | 100% / 100% / 100% | 100% / 100% / 100% |
| All four directly covered source modules | 98.41% / 98.08% / 100% | 98.44% / 98.04% / 100% |

The slight aggregate percentage changes reflect changed instrumented line/branch totals after extraction, not failing or removed tests. Both reports show the same uncovered SQLite lines 29–31. Coverage includes `dispensing.js`, `run-history.js`, `sqlite-history.js`, and `volume.js`; the bundled HTTP server is exercised by M6 acceptance tests but excluded from that source-coverage denominator. These runs did not execute the separate Playwright `test:e2e` command, which was not part of the requested four-command comparison.

## Saved before-and-after diffs

- [Runtime before-and-after diff](m7/before-after.diff): complete source refactoring, original main to the tested branch.
- [Complete tested-revision diff](m7/tested-revisions.diff): every committed change between those exact revisions, including the preliminary M7 document as it existed when tested. Its historical statement that verification was outstanding is superseded by this document and the actual logs.
- [Pinned GitHub comparison](https://github.com/treybarrett1/liquid-dispensing-iap/compare/05a1b79a80f189ebf49f12e313406ce18618f32e...fa0a51d0fdbda5a6f39983ad7956a17cb93a2ec6).

The saved diffs deliberately end at the tested revision, so they do not recursively include themselves or later evidence-only documentation. They were generated directly with `git diff --no-ext-diff --no-color --binary` and verified byte-for-byte against Git output.

## Prompt-and-diff log

### 1. Initial refactor (previously recorded)

**Prompt:** “Improve the internal structure of your app without changing what it does, and prove that is what happened.”

**Recorded AI assistance:** Reviewed `RunHistory` validation and M6 acceptance-test source; proposed and applied helper extraction while retaining input checks, messages, order, and the capacity comparison.

**Accepted diff:** `b5aedbde1d6b9a2a495bffd69fbcaa3b37a46698`, preserved in [before-after.diff](m7/before-after.diff). Added the private helper and replaced the two-iteration loop with two calls. Tests and public APIs were unchanged. The subsequent documentation commit `fa0a51d0fdbda5a6f39983ad7956a17cb93a2ec6` correctly left execution unverified at that time.

### 2. Evidence completion (this execution)

**User prompt:**

> Open repository treybarrett1/liquid-dispensing-iap and work on branch m7-refactor.
>
> Complete the M7 behavior-preserving refactoring assignment.
>
> 1. Check out the original main revision and run npm ci, npm run build, npm test, and npm run test:m6 using Node.js 24.
> 2. Save the original test output to docs/m7/before-tests.txt.
> 3. Check out m7-refactor and run the exact same tests, without changing the tests.
> 4. Save the results to docs/m7/after-tests.txt.
> 5. Verify that the refactor preserves behavior and that the same tests pass on both revisions.
> 6. Generate and save the before-and-after diff.
> 7. Update docs/M7_REFACTOR.md with the actual test results, code smell, refactoring explanation, and prompt-and-diff log.
> 8. If anything fails, investigate and fix the problem without weakening the tests. Rerun both revisions as necessary.
> 9. Commit and push all M7 evidence to m7-refactor.
>
> Do not modify the team repository. Do not fabricate test results. Report the final commit SHA and whether every rubric requirement is satisfied.

**Actions and disposition:** Fetched the personal remote, pinned both revisions, preserved existing local edits with an isolated worktree, executed the same commands on each revision, and captured their real outputs. Reviewed the extraction for preserved validation semantics and verified identical test inputs. Accepted the existing refactor without further runtime changes because both suites passed and source review found no contract change. Replaced the preliminary verification limitation with the actual evidence and this rubric mapping.

**Evidence-only diff:** Updated `docs/M7_REFACTOR.md`; added the two raw logs, two generated diffs, evidence consistency report, and the two reproducible capture/verification scripts under `docs/m7/`. A local `.gitattributes` keeps evidence files in LF format across Windows checkouts and permits the original trailing whitespace in raw logs/diffs. The completion commit has no changes under `src/`, `test/`, or dependency manifests. No rejected model patch or failed test execution was omitted from these runs.

## Reproduction and integrity checks

[Capture script](m7/capture-tests.mjs) runs the requested commands without editing tests, captures stdout/stderr separately, and returns nonzero if any command fails or an input changes. It requires Node 24, refuses to overwrite existing logs, and checks that runtime/test inputs match HEAD before execution. To reproduce, use clean checkouts of the pinned revisions, copy this evidence script into each checkout, and run `node docs/m7/capture-tests.mjs before` or `after` with fresh output paths (archive existing logs first).

[Verification script](m7/verify-evidence.mjs) checks the saved logs, test counts and names, input hashes, unchanged tests and build configuration, current runtime equivalence, and saved diffs. Run it from the repository root with `node docs/m7/verify-evidence.mjs`; it refreshes only `verification.txt` and returns nonzero on disagreement.

## Rubric / requested-evidence checklist

No separate point-weighted M7 rubric was present in the repository. This checklist maps the supplied assignment requirements without inventing grading points.

| Requirement | Status and evidence |
| --- | --- |
| Identify an actual code smell | Satisfied: mixed validation responsibilities and embedded numeric rule explained above. |
| Explain and show a behavior-preserving refactor | Satisfied: Extract Function, contract review, pinned source diff. |
| Run original main under Node 24 | Satisfied: exact original revision and four successful commands in `before-tests.txt`. |
| Run the identical unchanged tests after refactoring | Satisfied: four successful commands in `after-tests.txt`; matching test hashes, file counts, and M6 names. |
| Save genuine before/after output | Satisfied: raw stdout/stderr and exit statuses in both requested files. |
| Save before/after diff | Satisfied: source diff plus complete tested-revision diff. |
| Explain actual results and preserve prompt-and-diff log | Satisfied: this document and linked evidence. |
| Investigate failures without weakening tests | Satisfied: no build/test failure occurred; dependency warnings disclosed; tests unchanged. |
| Commit and push evidence to personal `m7-refactor` | Delivery is the evidence completion commit on that branch; its SHA is reported after push verification. |

These results establish the requested M7 evidence; they do not claim an instructor's grade or a course-site submission.
