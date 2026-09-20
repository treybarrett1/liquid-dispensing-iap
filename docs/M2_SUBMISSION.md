# IAP M2 - Submission Guide

Repository URL: **https://github.com/treybarrett1/liquid-dispensing-iap**

Milestone: Requirements and AI Elicitation Audit. Prepared September 20, 2026.

## Evidence to submit

| Rubric criterion | Points | Repository evidence |
| --- | --- | --- |
| 6-8 stories, consistent format, acceptance criteria | 4 | [Requirements](M2_REQUIREMENTS.md), US-01 through US-08; each uses As a / I want / so that and numbered Given/When/Then criteria. |
| Three falsifiable non-functional requirements | 3 | [Requirements](M2_REQUIREMENTS.md), NFR-01 through NFR-03: touch latency, shutdown latency, and offline/durable operation, each with named conditions and failure criteria. |
| Specific omissions, including questions not asked | 3 | [Audit](M2_AI_ELICITATION_AUDIT.md), O-01 through O-06, with response references, consequences, and resulting requirements. |
| Specific invented or unrequested requirements | 3 | [Audit](M2_AI_ELICITATION_AUDIT.md), I-01 through I-05, distinguishing conflicts, ambiguities, optional proposals, and provisional numbers. |
| Judgment and prompt-and-diff log | 2 | Audit Judgment and next-action sections; [AI_LOG.md](../AI_LOG.md) contains the M2 prompt-and-diff sequence and diff reproduction command. |

The separately collected [AI prompt](ai/M2_ELICITATION_PROMPT.txt), [full response](ai/M2_ELICITATION_RESPONSE.md), and [provenance](ai/M2_ELICITATION_CONTEXT.md) support the audit. Its useful-insight section identifies calibration identity and pump duration as additions to the recorded plan. AI assistance is disclosed throughout; no first-person personal realization is fabricated.

## Public repository status

Before this milestone, public `main` was `f32e6a0655424dafbc6408624b239a97434a1397`, last changed September 4, 2026 in America/Chicago (September 5 UTC). The local public checkout was restored to that baseline before the M2 documentation was added. The full application remains separate. The original calculation code, tests, dependencies, and ESP32 compilation-check source are unchanged by M2.

Current implemented behavior remains a desktop dispensing-time calculation with input validation. The interface, sensors, physical pump control, calibration, and outcome storage described in M2 are requirements, not newly shipped implementation. The September 4 toolchain compilation result is historical evidence; no firmware rebuild or hardware test was performed for M2.

## Verification and submission boundary

- `npm ci --no-audit --no-fund`: succeeded using the public baseline lockfile.
- `npm test`: all 12 existing calculator tests passed.
- Document checks cover eight stories, three NFRs, relative links, preserved response, and documentation-only changes; no new test suite was added for the documentation.
- Proposed physical performance and durability requirements remain untested.
- The GitHub commit containing this guide is the M2 evidence version. Use its permalink if a fixed submission reference is needed.
- This repository package does not constitute a submission to the course website. Submit the repository URL and, if requested by the instructor, links to the requirements, audit, and prompt-and-diff log.

The student's own reaction to the new logging suggestions should be confirmed if the instructor expects a first-person reflection. The audit currently distinguishes novelty relative to the documented plan from knowledge of the student's private prior thinking.
