# IAP M2 - Liquid Dispenser Requirements

Date: 2026-09-20

Repository: https://github.com/treybarrett1/liquid-dispensing-iap

## Basis and status

This specification covers the individual touchscreen and embedded controller application for the EECE 4991 liquid dispenser. Its source of scope is the public README at commit `f32e6a0655424dafbc6408624b239a97434a1397`, committed September 4, 2026 in America/Chicago (September 5 UTC). That baseline contains a JavaScript calculation prototype and an ESP32 dependency compilation check. These requirements describe intended behavior; they do not claim an implemented or physically validated dispenser.

The operator is the person filling a bottle. The developer/calibrator configures measured parameters during integration. The target is the ELECROW ESP32-S3 800 x 480 touchscreen, break-beam bottle detection, HX711 load-cell measurement, and a Kamoer pump controlled through the BTS7960 driver. Network accounts, cloud storage, remote pump commands, and medication/patient workflows are outside this milestone's scope; the baseline does not request them.

Authorship disclosure: Codex assisted in drafting this project-specific baseline from the existing project plan. It was saved before the separate AI elicitation run. It is not represented as an unaided student-written document. Numerical acceptance targets introduced here are proposed engineering requirements, not measured hardware capabilities or previously approved user preferences.

## Definitions and decisions still needed

- `V` is the requested volume in mL; `C` is the selected bottle's calibrated usable capacity in mL, excluding reserved headspace.
- Estimated volume is `(gross mass - tare mass) / liquid density`, using calibrated mass and a positive density in compatible units.
- A ready sensor frame must contain valid, timestamped readings, bottle presence, and a stable scale. Stability tolerance/window, freshness timeout, supported bottle capacities, tare procedure, density, flow bounds, cutoff reserve, manual-pulse limit, and maximum run time must be documented and validated before physical operation. Missing configuration blocks starting.
- A conservative addition bound includes maximum measured flow multiplied by pulse time plus worst-case control delay, then adds measured post-shutoff delivery. The proposed addition must fit within both the remaining requested volume and remaining usable capacity.
- The electrical default-off path, exact PCB revision, wiring, and unwanted gravity flow after shutoff remain integration questions. A software pump-off command alone does not prove liquid has stopped.

## User stories and acceptance criteria

### US-01 - Enter a target

As an operator, I want to enter and correct a target volume in milliliters so that the dispenser uses the quantity I intend.

- **AC1:** Given the volume-entry screen, when I enter digits, use Delete, and choose Enter, then the displayed value reflects those edits and explicitly shows mL.
- **AC2:** Given an empty, nonnumeric, nonfinite, zero, or negative target, when it is submitted, then an explanatory error is shown and pump output remains off.
- **AC3:** Given a finite positive target, when it is accepted, then the bottle-selection/waiting screen repeats that target; accepting a target alone never starts pumping.

### US-02 - Establish a suitable bottle

As an operator, I want the app to identify a suitable bottle and verify its presence so that I do not fill an absent or undersized container.

- **AC1:** Given a target `V`, when configured bottle options are checked, then only options with `C >= V` are eligible; if none qualify, confirmation remains disabled with an explanation.
- **AC2:** Given a selected eligible bottle, when detection is absent, invalid, stale, or the scale is unstable, then the app stays in the waiting state with pump output off.
- **AC3:** Given a detected bottle and stable valid readings, when I confirm the empty bottle and selected usable capacity, then the app establishes its tare and shows a final start confirmation. Presence alone cannot identify the bottle's capacity or prove it is empty.

### US-03 - Use calibrated measurements

As a developer/calibrator, I want validated measurement and delivery settings so that the controller makes volume decisions using the actual liquid and assembled system.

- **AC1:** Given known reference masses and a measured liquid density, when calibration is configured, then the application derives net mass and volume with the documented units; changing density changes the volume estimate accordingly.
- **AC2:** Given missing, nonfinite, nonpositive, or inconsistent required calibration/limit values, when starting is requested, then the request is rejected and the invalid setting is identified.
- **AC3:** Given configured flow and cutoff limits, when they are reviewed, then their values and calibration provenance are available in project configuration/documentation; the nominal 600 mL/min listing is not accepted as a measured maximum-flow bound.

### US-04 - Confirm and monitor automatic filling

As an operator, I want to confirm a fill and see measured progress so that I can supervise the requested dispense.

- **AC1:** Given a valid target, capacity, calibration, and ready sensor frame, when I explicitly confirm Start, then the app enters automatic filling and authorizes pump output. Cancel before Start returns to entry without pumping.
- **AC2:** Given an active fill, when valid measurements arrive, then target volume, measured volume, progress, and a usable Stop control remain visible. A time estimate is not presented as measured volume.
- **AC3:** Given the configured conservative cutoff has been reached, when pumping stops, then the app waits for the configured settling/stability condition and enters fill review without automatically marking the result accepted.

### US-05 - Stop and handle faults

As an operator, I want dispensing to stop on my request or a detected fault so that output cannot continue without valid authorization.

- **AC1:** Given automatic or manual pumping, when Stop/Cancel is requested, the bottle is removed, a required sensor becomes invalid/stale, or the maximum run time is reached, then the controller commands pump output off and records the specific reason. An installed configured upper-limit sensor must also stop output when triggered.
- **AC2:** Given stopped or faulted output, when readings become valid again or a button remains held, then output stays off; a fresh bottle/readiness check and explicit confirmation are required for a new cycle.
- **AC3:** Given startup, reset, or fault recovery, when the controller initializes, then its requested pump output is off. Physical verification of the motor driver's default-off behavior is a separate release condition.

### US-06 - Request one bounded manual addition

As an operator, I want one small addition per completed tap after reviewing an underfill so that I can approach the target without continuous pumping.

- **AC1:** Given fill review below target with valid interlocks, when I select Needs more and complete a press/release, then at most one configured bounded addition is issued; holding for 5 seconds does not repeat additions, and an abandoned/cancelled gesture issues none.
- **AC2:** Given an addition in progress, when further taps occur, then they are ignored rather than queued. A new completed gesture after the controller is ready is required for another addition.
- **AC3:** Given the conservative addition bound would exceed either `V` or `C`, when a tap is completed, then no addition occurs and the app explains why. The same bottle, sensor, and Stop interlocks apply as during automatic filling.
- **AC4:** Given a completed addition and a settled valid measurement, when review resumes, then the pulse count increases once and the measured increase is recorded; an unavailable measurement is explicitly marked unavailable rather than guessed.

### US-07 - Review and retain the outcome

As an operator, I want to accept a fill or mark it cancelled/failed and retain the result so that calibration work uses an accurate history.

- **AC1:** Given the review screen, when I accept or cancel the result, then the record is classified as confirmed or cancelled, respectively; a fault creates a failed record. Pump-off alone is not success.
- **AC2:** Given a recorded outcome, when it is inspected, then it includes target volume, final measured volume when available, manual-addition count and measured additions when available, outcome, fault/cancellation reason when applicable, and a run identifier. Unavailable values are labelled, not filled with zero.
- **AC3:** Given a saved terminal outcome, when the app returns to target entry, then revisiting or dismissing the result does not append a duplicate. Local history must be inspectable through a documented on-device or developer interface; a cloud dashboard is not required.

### US-08 - Recover an interrupted run

As an operator, I want a reset during dispensing to leave the pump off and identify the interruption so that an incomplete fill cannot silently resume or appear successful.

- **AC1:** Given a new authorized run, when pumping is about to begin, then a pending-run marker is durably saved first; if it cannot be saved, starting is blocked with an error.
- **AC2:** Given a restart with a pending-run marker, when initialization finishes, then the app marks that run interrupted/failed once and requests pump output off. Its last saved quantity is labelled a checkpoint rather than a final measurement.
- **AC3:** Given recovery is complete, when I want another fill, then the app requires a new target/readiness check and explicit start confirmation, even if the previous bottle is still present.

## Exactly three non-functional requirements

These are proposed acceptance thresholds. Passing desktop unit tests does not validate these hardware targets.

### NFR-01 - Interface responsiveness

On the target 800 x 480 ESP32-S3 display with normal sensor sampling and outcome logging enabled, at least 95 of 100 valid touch actions must produce visible acknowledgement within 200 ms, and all 100 within 500 ms, measured from the touch event accepted by the app to the first frame displaying its result. Exercise 25 actions each in entry, confirmation, active-fill Stop, and review/manual-addition states, resetting test state as needed. Capture event/frame timestamps or synchronized video. Failure of either bound falsifies this requirement; pump shutdown is independently governed by NFR-02.

### NFR-02 - Bounded software shutdown latency

For 100 injected events (20 each: Stop, bottle-absent, invalid sensor, stale-reading timeout, and run-time timeout), the motor driver's commanded enable signal must reach its off level within 100 ms of the controller receiving the event or the configured timeout expiring. Run half during automatic filling and half during a manual addition while the display and logging are active. Use a logic analyzer on event instrumentation and the driver-enable output; any event exceeding 100 ms fails. Separately confirm no re-enable occurs without a new authorized cycle. This measures software/electrical command latency, not motor coast or cessation of liquid flow; those need measured cutoff reserve and physical validation.

### NFR-03 - Offline operation and durable local history

With Wi-Fi disabled and no network connection, the app must support entry, authorized filling, review, and local outcome inspection and preserve the latest 50 completed outcomes plus one active pending-run marker across 20 power interruptions. Run a 60-outcome scripted sequence, interrupt power during 10 idle/review cases and 10 active cases, and compare recovered records against the last acknowledged saved outcomes. Each active interruption must produce exactly one interrupted outcome after restart, without automatic pump restart. Once more than 50 terminal records exist, only the oldest may be evicted. Loss/corruption of an acknowledged retained record, a duplicate interrupted record, inability to run offline, or automatic restart fails. If storage cannot commit a pending marker, starting must be blocked. The storage technology remains an implementation choice; loss of an unsaved latest sensor sample is allowed and must be disclosed as a checkpoint limitation.

## Traceability and open validation

| Requirement | Basis | Planned verification |
| --- | --- | --- |
| US-01, US-02, US-04 | Baseline README display workflow 1-3 | UI/state tests with invalid entry, missing bottle, and explicit confirmation |
| US-03, US-05 | Baseline sensor/pump logic | Calibration fixtures, sensor/fault injection, electrical shutdown measurements |
| US-06, US-07 | Baseline display workflow 4-6 and sensor/pump logic | Held/cancelled gestures, no queue, capacity bounds, exact outcome records |
| US-08 | Baseline default-off startup/reset; durable interruption record is an M2 proposal | Power interruption and recovery tests |
| NFR-01, NFR-02 | Proposed quantitative versions of baseline responsiveness and shutoff requirements | Target-device timing measurements |
| NFR-03 | Baseline outcome logging; offline scope, retention count and recovery test are M2 proposals | Offline and power-interruption test sequence |

Before physical use, resolve the calibration and interface questions above and verify bottle fit, capacity/headspace, sensor levels, default-off wiring, pump coast, and gravity flow. This M2 documentation change adds no new app implementation and supplies no physical-test results.
