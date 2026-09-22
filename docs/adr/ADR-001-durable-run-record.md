# ADR-001 - Use one durable run record across pending and terminal states

**Status:** Accepted for the domain design; persistence implementation and hardware validation remain pending.

**Date:** 2026-09-22.

**Scope:** The logical representation, ownership, and recovery of a dispensing run's saved data. This ADR does not select a storage library or physical file/flash layout.

## Context

The dispenser must retain useful evidence even when power fails during a fill. M2 [US-07, US-08, and NFR-03](../M2_REQUIREMENTS.md) require a run identifier, outcome, available measurements, manual-addition information, a durable pending marker before pumping, and recovery without restarting the pump or duplicating the outcome. The local history must retain the latest 50 terminal outcomes plus at most one pending run. The screen's current session can disappear on reset; the saved evidence cannot depend on that session remaining alive.

This creates a concrete architecture question: should pending work and completed results be different saved objects, successive states of one record, or results reconstructed from a stream of events?

The choice was already made in the September 20 [M3 domain model](../M3_DOMAIN_MODEL.md), committed in [`90b3d4f`](https://github.com/treybarrett1/liquid-dispensing-iap/commit/90b3d4fb844dbd356866b3a4b4b2105c0c8e93ca). The preserved [AI first draft](../ai/M3_DOMAIN_FIRST_DRAFT.md) used separate `PendingRunMarker` and `RunOutcome` classes, both repeating the run ID and target. It also made the runtime `DispenseRun` own manual additions while the retained outcome referenced them. The [M3 critique](../M3_AI_MODEL_CRITIQUE.md), particularly O-04 and U-01 through U-04, weighed the resulting ownership, duplication, and recovery problems. The revision selected one durable `RunRecord` owning its additions, with a transient `FillSession` updating it.

The forces behind that choice are:

- **Recovery must be unambiguous.** An interrupted run must become one failed/interrupted outcome, and an already completed run must not be converted again after reboot.
- **The device keeps bounded local history.** It does not currently need a full sensor trace or a replayable history of every touch and controller transition.
- **Addition details must survive the UI session.** They are evidence for reviewing a fill and later calibration, not children that disappear when a screen or controller object is replaced.
- **Saved data and actuator timing have different obligations.** The initial pending state must be saved before output is enabled, but stopping the pump must not wait for a record write. M2 NFR-02 specifies a 100 ms off-command bound that still needs device verification.
- **Complexity must earn its cost.** A more elaborate history could improve diagnostics, but it also needs more recovery rules, schema management, storage sizing, and tests on the embedded device.

The separate-record alternative was explicitly considered in M3. The event-history alternative below is evaluated on September 22 while recording and rechecking this decision; it is not claimed to have been implemented or benchmarked earlier. This ADR records an existing design choice and a current comparison of credible alternatives, not a fictional implementation history.

## Decision

**Represent each authorized dispensing run as one logical durable `RunRecord`, identified by a stable `runId`, whose status changes from Pending to exactly one terminal status: Confirmed, Cancelled, or Failed. That record owns the run's manual-addition values.**

`LocalHistory` retains the records. `FillSession` contains temporary interaction and control state and may reference the current record; retained records do not require a live session.

The rules of this decision are:

1. Validate target, bottle readiness, capacity, and calibration; allocate the run identity and durably commit its Pending state **before** requesting initial pump output. If that save fails, starting is blocked.
2. Preserve the same `runId` when checkpointing and finalizing. A repeated terminal-finalization request must not append a second outcome or change a previously committed terminal result.
3. Retain target, usable capacity, available result/checkpoint measurement, measurement kind, reason, and issued-addition details. Derive completed-addition count from the completed entries rather than maintaining independent authoritative counts.
4. On reboot, request pump output off. Recover a Pending record as Failed with reason `interrupted`, under the same ID. Label its available measurement LastCheckpoint or Unavailable. Never treat a checkpoint as a final measurement or resume pumping automatically.
5. Retain at most 50 terminal records and one Pending record. Use the model's durable ordering sequence to select the oldest terminal record for eviction. Never evict the pending run to make room.
6. Make record replacement/finalization and retention recoverable under power interruption. The backend must preserve acknowledged retained data and valid state. A single *logical* record does not mean overwriting one unprotected physical flash slot.

This leaves the storage backend, serialization, atomic-write mechanism, checkpoint schedule, and flash layout open. Copy-on-write slots, a transactional backend, or a low-level recovery journal can implement the logical record contract. Such a journal is different from making a domain-event stream the source of truth for the application.

## Alternatives considered

### Alternative 1 - Separate pending marker and terminal outcome records

Maintain a small `PendingRunMarker` while the pump run is active, then create an immutable `RunOutcome` containing the result and addition details. Retire the marker after the outcome is safely saved.

**Why it is a genuine option:** It is the actual structure in the preserved M3 first draft. A small pending marker can be cheaper to update, and a separate immutable outcome avoids rewriting completed records. Active recovery data and review/history data can have different schemas and storage areas.

**Why it was not chosen:** The handoff becomes part of the recovery protocol. A power cut after saving the outcome but before clearing its marker can leave both objects present; clearing the marker first can lose the interruption evidence if the outcome save then fails. Stable IDs, deduplication, and transactional/recoverable handoff can solve this, but they add coordination rules. Run identity and target are duplicated, and the design must explicitly transfer or copy addition details to a durable owner. For one active run and a small bounded history, the selected logical record makes that lifecycle easier to state and review.

**What is given up by rejecting it:** The pending checkpoint cannot automatically remain tiny and independent of the result schema. The chosen record may need partial checkpoints or multiple physical slots to avoid expensive full-record rewrites. If measurements show that a separate compact marker materially improves latency or flash-write cost, this alternative should be reconsidered.

### Alternative 2 - Append-only domain events with replayed outcomes

Append events such as `RunStarted`, `AdditionIssued`, `AdditionCompleted`, `CheckpointSaved`, and `RunFinalized`; derive pending state and terminal outcomes by replaying or projecting those events for each run ID.

**Why it is a genuine option:** The workflow already has identifiable transitions. Recording them would preserve more evidence for diagnosing the order of faults, touches, and additions. An append-oriented store can also avoid some in-place overwrite hazards, although torn or incomplete appends still need detection and recovery. This option is attractive if calibration work later requires the complete sequence rather than final values and addition results.

**Why it was not chosen:** M2 requires retained outcomes and bounded addition evidence, not a complete event history. Replay needs ordered/versioned event schemas, duplicate handling, detection of incomplete writes, and a defined recovery rule for each partial sequence. Bounded retention then requires compaction, snapshots, or whole-run event eviction. These mechanisms increase implementation and test scope while the current target is one device, one active run, and 50 retained terminal records. No event-store implementation or performance advantage has been measured for this project.

**What is given up by rejecting it:** A saved result cannot reconstruct every intermediate sensor value, discarded tap, or controller transition. Later debugging cannot recover events that were never retained. Adding full replay in the future would require new data capture, an event schema, and a migration strategy; it cannot be obtained merely by adding a viewer over existing run records.

### Comparison

| Concern | One logical RunRecord - chosen | Separate marker/outcome | Append-only domain events |
| --- | --- | --- | --- |
| Source of truth | One run identity and current durable state | Coordinated active marker and terminal result | Ordered events plus replay/projection rules |
| Recovery burden | Recover/replace the same record safely | Reconcile creation of outcome and retirement of marker | Validate partial stream and replay idempotently |
| Useful strength | Direct ownership and bounded history | Compact independent checkpoint and immutable outcome | Detailed sequence for diagnosis and reconstruction |
| Main cost | Mutable-state durability and incomplete historical detail | Cross-record handoff and duplicated information | Replay, event versioning, compaction, and larger test scope |
| Fit to current M2 scope | Covers the required results and recovery | Viable, but adds a handoff protocol | More history machinery than currently required |

## Consequences

### What becomes easier

- **Review and recovery use the same identity.** `runId` identifies a pending run, its recovered failure, and its terminal result; a repeated recovery request does not create another logical run.
- **Ownership is explicit.** Addition details belong to the retained record and survive destruction of `FillSession`. Oldest-record eviction also removes that record's addition values.
- **The public domain model stays small.** The requirements map directly to one pending-to-terminal lifecycle and a collection with a precise retention invariant.
- **Tests have clear assertions.** They can inspect one record's status, measurement kind, addition entries, and uniqueness rather than infer whether a marker/outcome pair has completed its handoff.

### What becomes harder or is lost

- **Safe updates are still difficult.** A power cut during a checkpoint or finalization must not destroy the last acknowledged version. The backend needs atomic or recoverable writes and failure-injection tests. A simpler class diagram does not remove that engineering work.
- **Checkpoint size and write frequency must be controlled.** As additions accumulate, rewriting an entire run record may cost more latency and flash writes. The implementation must measure this and choose a bounded representation/checkpoint policy. UML `0..*` does not provide unlimited storage.
- **The record now has state-dependent validity.** Pending records may legitimately lack a final volume; terminal records need a valid classification and appropriate reason/measurement kind. Validation and schema changes must preserve those distinctions.
- **Crash consistency includes eviction.** Finalizing a run when 50 terminal records already exist must not lose an acknowledged record outside the allowed oldest-first eviction rule. Stable run-ID and sequence allocation must also survive reboot.
- **There is no complete historical replay.** Intermediate states that were not checkpointed cannot be reconstructed. This limits diagnosis and future analyses of exactly when sensor values changed or taps were ignored.
- **Evidence has a finite life.** Keeping only 50 terminal records removes older calibration evidence. Long-term or cross-device analysis would require a separately specified export/retention feature; neither is introduced by this ADR.
- **The current API assumes one pending run.** Multiple pumps, queued independent runs, or concurrent devices sharing one history would require new coordination and identity/retention rules. They are not supported by merely increasing the collection size.

### Follow-up and conditions for revisiting

Implement and verify the M2 NFR-03 offline/power-interruption scenario, including interruption during initial save, checkpoint replacement, finalization, eviction, and recovery itself. Verify that save failure prevents initial pumping, recovery leaves output off, repeated recovery creates no duplicate, and acknowledged retained data remains readable. Independently measure NFR-02 shutdown latency while storage and display work are active. These are planned checks, not results of this documentation change.

Revisit the decision if checkpoint latency/write cost fails the device's limits, the required per-run addition data cannot fit the storage budget, complete event-sequence diagnosis becomes a requirement, or the system needs multiple simultaneous pending runs. The concrete cost of changing direction would include a new persistence schema, recovery rules, migration of existing records, and a new power-interruption test matrix.

## Evidence and implementation status

This ADR formalizes the already committed M3 design. The public repository currently provides the calculation prototype and compile-only ESP32 toolchain check; it does not implement this persistence contract. The full application remains separate, and this ADR makes no claim that it already uses this model. No flash endurance, storage latency, physical pump behavior, or power-loss result is asserted here.

AI assistance in drafting and reviewing this ADR is recorded in the [prompt-and-diff log](../../AI_LOG.md). The alternatives are design evaluations, not fabricated experiments or claims about undocumented prior personal deliberations.
