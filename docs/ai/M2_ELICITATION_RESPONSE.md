The following requirements are proposed from the supplied concept. Numeric performance targets are provisional until verified on the hardware.

**User stories and acceptance criteria**

1. **Enter a target volume.** As an operator, I want to enter a target in mL so that I can request the intended fill.
   - The screen provides numeric entry and clearly displays the unit “mL.”
   - Empty, zero, negative, and out-of-range values prevent confirmation and produce a clear message.
   - The accepted target remains visible during confirmation and dispensing.
   - Minimum, maximum, and supported decimal precision are configurable requirements to be agreed.

2. **Prepare and detect the bottle.** As an operator, I want the app to verify bottle presence and establish its empty weight so that dispensing measures liquid rather than bottle weight.
   - The screen shows whether the IR break-beam detects a bottle.
   - Starting requires bottle detection and a valid, stable load-cell reading.
   - The app establishes a tare with the bottle in place before allowing confirmation.
   - Missing, unstable, or invalid readings explain why dispensing cannot begin.
   - Bottle removal invalidates readiness and requires preparation again.

3. **Confirm dispensing.** As an operator, I want to review and confirm the target so that the pump starts only when I am ready.
   - The confirmation screen displays the requested volume and bottle readiness.
   - The pump remains off until the operator explicitly confirms.
   - Readiness is checked again when confirmation is pressed.
   - Repeated presses cannot start overlapping dispensing operations.

4. **Monitor and complete a fill.** As an operator, I want to see progress and have dispensing stop at the target so that I can follow the fill.
   - The display shows the target, estimated delivered volume, and current operating state.
   - Estimated volume uses the active calibration and agreed mass-to-volume conversion.
   - The controller stops the pump automatically according to the agreed target-stop rule.
   - Bottle removal or a detected load-cell fault stops the pump and displays the reason.
   - A stopped or interrupted fill never restarts without explicit operator action.

5. **Stop or cancel dispensing.** As an operator, I want accessible stop and cancel controls so that I can interrupt an unwanted fill.
   - A stop control remains available whenever the pump runs.
   - Stop commands the pump off and preserves the partial-fill measurements for review.
   - Cancel before dispensing returns to target entry without running the pump.
   - Cancel during dispensing commands the pump off and records the fill as canceled.
   - Any cancellation confirmation occurs after the pump is commanded off.

6. **Review the result.** As an operator, I want to review the fill so that I can accept it or request an addition.
   - Review displays the requested volume, final measured net mass, estimated delivered volume, and completion status.
   - Final measurements are captured after the load-cell reading settles; an unsettled or invalid result is identified.
   - Interrupted and canceled fills remain distinguishable from normally completed fills.
   - Accepting the result closes the fill session.

7. **Request small manual additions.** As an operator, I want to request a small additional amount so that I can adjust an underfilled bottle.
   - Review offers an addition control using an agreed increment or bounded entry range.
   - Each addition requires explicit confirmation and the same bottle and sensor readiness checks as the initial fill.
   - The original bottle tare is retained throughout the session.
   - Stop and fault handling remain available during each addition.
   - After each addition, the screen returns to review and shows the cumulative delivered amount.

8. **Record results for calibration.** As an operator, I want a record of fills and additions so that I can analyze dispensing behavior.
   - Each fill has a unique session identifier.
   - Records include the requested target, tare, measured net mass, estimated volume, calibration identifier, pump run duration, and final status.
   - Every manual addition is linked to its fill and records its requested amount, measured change, and pump run duration.
   - Cancellations, interruptions, and fault reasons are recorded.
   - Records can be retrieved through an agreed on-device review or export method.
   - A failed save is reported rather than shown as successful.

**Three measurable non-functional requirements**

1. **Control response:** On the target hardware, the pump-disable output shall assert within **100 ms** of a recognized stop/cancel action or declared bottle/sensor fault in **100 consecutive trials per trigger**. Physical pump stopping time and residual delivered volume shall be measured separately.

2. **Display responsiveness:** During dispensing, progress shall refresh at least **4 times per second**, and valid touch actions shall receive visible feedback within **200 ms** in at least **95% of 100 measured interactions**.

3. **Record durability:** Successfully saved records shall survive restart without changed values or missing addition links in **100 power-cycle trials**. If power is lost during a save, previously committed records shall remain readable, and the incomplete session shall not appear as successfully completed.

**Assumptions**

- The HX711 measures mass; displayed mL therefore requires a defined liquid density or an experimentally validated conversion.
- The bottle rests on the load cell, and its empty weight can be established before filling.
- “Stop” ends pumping and opens review; resuming is done through an explicit addition. A separate pause/resume feature is not assumed.
- The pump defaults to off during startup and after reset. Restarting the app does not resume an interrupted fill.
- The numeric non-functional targets above are proposed requirements, not validated hardware capabilities.

**Clarifying questions**

- What liquids are supported, and how will their density or mass-to-volume conversion be supplied?
- What target-volume range, entry precision, and allowable final-volume error are required?
- What defines a stable reading, a stale or faulty sensor, and confirmed bottle presence? Is a maximum pump runtime required?
- Should manual additions use fixed mL increments, entered mL amounts, or timed pump pulses? What is the maximum permitted addition?
- Where should records be stored, how many must be retained, and how will calibration data be retrieved? Is a real-time timestamp required?
- Should calibration be editable in this app, or will it only record data for calibration performed elsewhere?
