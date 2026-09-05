# AI Prompt-and-Diff Log

## 2026-09-04 — Initial milestone completion

**Tool:** OpenAI Codex

**Prompt:** "finish what we need in the current folder opened," accompanied by the milestone requirements for a repository, concept-and-stack README, working toolchain, AI-tool verification, at least one commit, and submission evidence.

**Resulting changes:**

- Replaced the dispensing-time pseudocode with executable JavaScript.
- Added validation for positive, finite numeric measurements.
- Added Vitest coverage for normal, decimal, and invalid inputs.
- Added the concept brief, declared stack, setup, usage, and evidence commands to the README.
- Added repository ignore rules and aligned Vitest with the declared Node.js 18+ runtime.

**Verification:** Codex ran the runtime, package-manager, test-runner, and Git commands in the project environment. The final command results are summarized in the completion handoff; they can be reproduced using the README commands.

## 2026-09-04 — Clarify the display application scope

**Tool:** OpenAI Codex

**Prompt:** "i am using this indivial app project to make the display for a another course the junior design eece 4991", accompanied by a dispenser and touchscreen workflow sketch.

**Resulting changes:** Updated the README title and concept brief to describe the individual touchscreen application for the EECE 4991 dispenser. Documented the sketched screen flow, distinguished implemented calculation code from planned display and controller work, and identified the display stack and hardware behavior that still need confirmation.

**Verification:** Reviewed the documentation diff against the supplied sketch. No executable code changed.

## 2026-09-04 — Identify the target touchscreen

**Tool:** OpenAI Codex

**Prompt summary:** User identified the ELECROW ESP32-S3 Advanced 5-inch 800 x 480 IPS HMI with 8 MB PSRAM and 16 MB flash.

**Resulting changes:** Documented the CrowPanel Advance display, proposed C++/Arduino/LVGL with PlatformIO for the embedded application, and clarified that the existing Node.js/Vitest toolchain verifies the desktop calculation prototype. Added official hardware references and identified PCB revision and controller architecture as remaining implementation details.

**Verification:** Checked ELECROW's product information and revision-specific wiki, and ran `git diff --check`. No firmware was built or flashed; no executable code changed.

## 2026-09-04 — Include sensor and pump control

**Tool:** OpenAI Codex

**Prompt:** "also it has to operate the logic for the sensors and the pump to run it"

**Resulting changes:** Expanded the README concept and title to cover the full embedded dispenser control application on the display's ESP32-S3. Added planned sensor processing, dispensing states, motor-driver control, stop/fault behavior, bounded manual additions, calibration needs, and hardware verification requirements. Removed the unresolved separate-controller architecture from the current scope.

**Verification:** Reviewed the documentation for consistency with the clarified scope and ran `git diff --check`. No executable code changed, and sensor or pump operation has not been implemented or tested.

## 2026-09-04 — Record purchased components

**Tool:** OpenAI Codex

**Prompt summary:** User supplied order screenshots showing the Kamoer KPHM600-SW3B17 pump, MTDELE BTS7960 motor driver, break-beam sensors, load-cell kits, ELECROW display, power components, fuse holders, and Grove cables.

**Resulting changes:** Added the selected hardware inventory and sensor-to-controller-to-driver control path to the README. Recorded listing ratings as unverified product information and left truncated sensor specifications, amplifier identity, board revision, and GPIO assignments unresolved.

**Verification:** Matched inventory entries to visible screenshot text and ran `git diff --check`. No wiring, firmware, or hardware operation was tested.

## 2026-09-04 — Identify sensor specifications

**Tool:** OpenAI Codex

**Prompt summary:** User provided expanded product screenshots for the MELIFE 5 V NPN normally-open IR break-beam sensors and Diitao 5 kg load-cell kits with HX711 boards.

**Resulting changes:** Updated the README inventory with the visible sensor specifications and replaced the unresolved amplifier identity and load-cell capacity with HX711 and 5 kg. Retained wiring, signal compatibility, mounting, and calibration as unverified implementation details.

**Verification:** Matched the revised inventory against the supplied screenshots and ran `git diff --check`. No executable code changed or hardware tests were performed.
