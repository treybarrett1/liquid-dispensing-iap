# AI Prompt-and-Diff Log

## 2026-09-20 - M2 requirements and AI elicitation audit

**Tool:** OpenAI Codex for repository work, project-specific requirements, and audit drafting; one separate Codex agent session for elicitation, with no shared conversation history. The exact model identifier was not independently returned by the agent tool. All new M2 prose is AI-assisted; no unaided student authorship or invented personal reflection is claimed.

**User prompt:** "okay lets go back to the public iap, see what the current status and make sure the local reflects the status from last changes 2 week ago then complete this assignment." The attached IAP M2 rubric calls for 6-8 consistently formatted stories with acceptance criteria, exactly three falsifiable NFRs, a separate retained AI elicitation response, an audit of omissions/inventions/useful insights with a judgment, the repository URL, and a prompt-and-diff log.

**Starting point:** Live GitHub `main` was verified at `f32e6a0655424dafbc6408624b239a97434a1397`, committed September 4 in America/Chicago (September 5 UTC). It contained the calculation prototype and dependency-only ESP32 compilation check. Newer local application work was preserved separately and in a named local stash before restoring this checkout to the public baseline. No app source, simulator, or dispenser firmware was added to this milestone.

**Separate elicitation prompt and result:** [Exact concept prompt](docs/ai/M2_ELICITATION_PROMPT.txt), [additional operational constraint and provenance](docs/ai/M2_ELICITATION_CONTEXT.md), and [unedited first response](docs/ai/M2_ELICITATION_RESPONSE.md). The project-specific requirements file was saved before the elicitation run; its pre-run hash is recorded in provenance. The response was not coached to invent unwanted features or omit requirements.

**Prompt-and-diff sequence:**

| Step | Input / decision | Resulting diff |
| --- | --- | --- |
| 1 | User's M2 assignment and September 4 scope | Added `docs/M2_REQUIREMENTS.md`: eight stories with Given/When/Then criteria, exactly three measurable NFRs, traceability, and unresolved hardware/calibration decisions. |
| 2 | Separate concept prompt, then a no-file-access evidence constraint | Added the exact prompt, unchanged AI response, and provenance under `docs/ai/`. No generated requirements were silently substituted for the project-specific draft. |
| 3 | Compare generated text with scope and requirements | Added `docs/M2_AI_ELICITATION_AUDIT.md`: six omission findings, five unrequested/ambiguous proposal findings, useful insights, and accept/reject/clarify decisions. |
| 4 | Preserve the one-tap workflow and fresh-confirmation recovery rule | Rejected the AI's alternate entered-volume top-up and post-Stop addition recovery; clarified that a completed tap is authorization, not a required extra modal dialog. These decisions are recorded in the audit; app code was not changed. |
| 5 | Make the submission navigable | Added `docs/M2_SUBMISSION.md`; added M2 links/status to README and this log entry. |

**Verification:** Reinstalled from the baseline lockfile with `npm ci --no-audit --no-fund` and ran `npm test`: 12 tests passed. Those tests exercise only the existing calculator and validation module. Reviewed story/NFR counts, retained AI-response integrity, document links, documentation-only diff, and staged whitespace checks. No browser, embedded build, or physical tests were claimed for this documentation change. Remote publication is verified after pushing by checking repository visibility, `main` commit, and file hashes against the local commit.

**Review the actual diff:** `git diff f32e6a0655424dafbc6408624b239a97434a1397..HEAD -- README.md AI_LOG.md docs`. `git diff f32e6a0655424dafbc6408624b239a97434a1397..HEAD -- src test tools package.json package-lock.json .gitignore .vscode` must be empty for this milestone. This log gives the rationale; Git retains the exact edits.

**Limitations:** New timing, durability, and retention thresholds are proposed requirements, not measured results. Existing hardware questions remain open. Useful ideas are compared against the recorded plan, not falsely attributed to the student's private thoughts. The repository evidence is prepared for submission; no course-site submission is performed.

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

## 2026-09-04 — Install the embedded development tools

**Tool:** OpenAI Codex

**Prompt:** "lets install all needed tools to do this project"

**Resulting changes:** Installed the PlatformIO IDE extension, an isolated Python 3.11 environment, and the PlatformIO Core tools. Added the Core commands to the user PATH. Used the ESP32 platform and display-library versions from ELECROW's current V1.2/V1.3 example and added the HX711 library. Created `tools/esp32-check` as a small compile-only C++ installation check, added setup documentation and extension recommendations, and ignored generated `.pio` directories. The check does not implement the dispenser or assign hardware pins.

**Installation troubleshooting:** The VS Code extension's automatic Core installer overlapped with the manual installation and reported a missing `pip` module. Verified the completed environment's `pip` and Core commands before continuing. No antivirus settings were changed.

**Verification:** The existing 12 JavaScript tests pass. The ESP32-S3 installation check compiled and linked successfully with Arduino-ESP32, LVGL, LovyanGFX, TAMC_GT911, and HX711. The platform installer added pioarduino Core dependencies; aligned Uvicorn to 0.40.0 and Click to 8.3.3 to satisfy the installed tools. Versions and reproduction commands are recorded in `tools/esp32-check/README.md`. No serial device was detected, no board was flashed, and physical display, sensor, and pump behavior has not been tested. The PCB revision remains unconfirmed.
