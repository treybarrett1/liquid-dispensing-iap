# IAP M4 - ADR-001 Submission Guide

Repository URL: **https://github.com/treybarrett1/liquid-dispensing-iap**

ADR: **[ADR-001 - Use one durable run record across pending and terminal states](adr/ADR-001-durable-run-record.md)**

Direct submission link: https://github.com/treybarrett1/liquid-dispensing-iap/blob/main/docs/adr/ADR-001-durable-run-record.md

Prepared September 22, 2026. The supplied assignment lists September 28, 2026 at 11:59 PM; the screenshot does not identify a timezone.

## Evidence and rubric

| Criterion | Points | Evidence |
| --- | --- | --- |
| Context establishes the forces requiring a decision | 3 | ADR Context: power interruption, durable addition evidence, bounded offline history, and shutdown latency; links to actual M2 and M3 artifacts. |
| Decision is unambiguous | 2 | ADR Decision: one stable run identity, Pending-to-terminal state, durable ownership, and explicit recovery/retention rules. |
| At least two genuine alternatives, with rejection reasons | 4 | Separate pending-marker/outcome records from the actual M3 first draft, and an append-only event history evaluated for this ADR. Each has a benefit, rejection rationale, and a cost of rejecting it. |
| Consequences explain what is harder | 4 | ADR Consequences: crash-safe replacement, checkpoint size/write cost, state-dependent validation, eviction consistency, lost event detail, finite history, and limits on concurrency. |
| Markdown committed; prompt-and-diff log present | 2 | ADR markdown under `docs/adr/`, with the M4 entry in [AI_LOG.md](../AI_LOG.md). |

The decision was already adopted in the September 20 M3 model. The ADR dates the additional event-history comparison to September 22 rather than inventing earlier testing or deliberation. Acceptance is at the design level; storage implementation and device validation remain future work.

This milestone adds documentation only. The full app is not added to the public repository. The repository package is ready for submission after publication verification; it has not been submitted to the course website by this task.
