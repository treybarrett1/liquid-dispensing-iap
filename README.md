# Liquid Dispenser Control Application

## Run the M5 walking skeleton

The runnable slice is a **desktop developer interface for durable run history**: browser form -> HTTP -> validation/lifecycle rules -> real SQLite file -> database readback. After a server restart, a pending record becomes Failed/interrupted under the same ID. This is a storage workflow, not simulated dispensing or physical pump authorization.

Use **Node.js 24 LTS** and npm:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:5173**. Enter a target and usable capacity, save a pending record, then stop the server with Ctrl+C and run `npm start` again. Refresh: the same run ID is now Failed with reason `interrupted`. Restart once more to verify there is no duplicate. A pending record can instead be cancelled in the interface.

The database is `data/dispenser.sqlite`, ignored by Git. Keep it between restarts; use one server process per database. `IAP_DB_PATH` selects another file and `PORT` another local port. The server binds only to loopback. Saved records use neither browser storage nor an in-memory database.

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

The build bundles the production server/browser JavaScript and copies page/styles into `dist/`. End-to-end tests launch that built server, use a browser, independently query a temporary SQLite file, terminate/restart the process, and capture evidence. See the [M5 submission guide](docs/M5_SUBMISSION.md) and [ADR-002](docs/adr/ADR-002-desktop-storage-slice.md).

## Concept brief

This Individual App Project (IAP) will provide the touchscreen interface and embedded control logic for the liquid-dispensing system being developed in EECE 4991 Junior Design. Running on the ELECROW ESP32-S3 display board, the application will accept a target volume in milliliters, read the bottle-detection and load-cell sensors, operate the pump through its motor driver, show dispensing progress, and handle stop, cancel, and fault conditions. After dispensing, the user will confirm the fill or request small manual additions, with each completed tap requesting one bounded addition rather than continuous dispensing when held. The app will record outcomes and manual additions to support later calibration work. The individual software scope includes the screens, sensor processing, dispensing sequence, and pump-control logic; hardware selection, wiring, and mechanical assembly are part of the broader Junior Design system. The current repository provides an initial calculation and validation module with automated tests; the embedded interface, sensor drivers, and pump control are planned work.

## Declared stack

Planned embedded control application:

- Hardware: ELECROW CrowPanel Advance 5.0-inch HMI, ESP32-S3, 800 x 480 IPS touchscreen (manufacturer model DIS02050A).
- Processor and memory: dual-core Xtensa LX7 up to 240 MHz, 512 KB SRAM, 8 MB PSRAM, and 16 MB flash.
- Firmware stack: C++ with the Arduino framework and LVGL for the touchscreen interface.
- Build and dependency tooling: PlatformIO in VS Code. The installation check pins the pioarduino ESP32 platform and library versions used by ELECROW's current V1.2/V1.3 example; deployable firmware still needs to match the physical board revision.
- Version control and hosting: Git and GitHub.
- AI coding tool: OpenAI Codex.

Current calculation prototype and verified desktop toolchain:

- Runtime and language: Node.js 24 LTS with modern JavaScript (ES modules); built-in SQLite supports the M5 desktop storage adapter.
- Package manager: npm
- Test runner: Vitest
- Version control and hosting: Git and GitHub
- AI coding tool: OpenAI Codex

The JavaScript code runs on the development computer. M5 adds an HTTP service, SQLite persistence, browser interface, integration tests, and browser/restart tests alongside the calculator. The repository also contains the C++ installation check in `tools/esp32-check`. Physical firmware integration remains planned; this desktop slice does not validate the display, sensors, driver, or pump.

## Selected hardware

Listing ratings are recorded for identification; electrical compatibility and actual dispensing performance have not yet been verified.

| Component | Selected part / visible listing | Details still needed |
| --- | --- | --- |
| Touchscreen/controller | ELECROW Advanced 5-inch ESP32-S3 IPS HMI, 800 x 480 | PCB revision |
| Pump | Kamoer KPHM600-SW3B17 brushed-motor peristaltic pump, listed at 600 mL/min | Rated motor voltage/current and measured flow with the chosen tubing/liquid |
| Motor driver | MTDELE BTS7960 H-bridge module, marketed as 43 A | Module schematic/pinout, logic-input compatibility, and operating limits |
| Bottle detection | MELIFE IR break-beam sensor set; listed as 5 V, NPN normally open, 5 mm LEDs, 25 cm cables, 80 cm test distance | Wire/connector pinout, output circuit and voltage compatibility, blocked/clear signal behavior, and number of beams to use |
| Weight measurement | Diitao kit with three 5 kg bar load cells and HX711 ADC/amplifier boards | Board supply/logic wiring, load-cell wire mapping, mechanical mounting, and calibration |
| Main supply | 12 V, 8 A, 96 W AC/DC adapter | Connector polarity and verified load requirements |
| Display supply converter | PlusRoc DC 12 V/24 V to 5 V, 5 A buck converter with USB-C output | Connection and power verification with the display |
| Fuse holders | Cooclensportey four-pack, 12 AWG inline holders | Fuse selection for the actual wiring and load |
| Signal cables | Seeed Studio Grove four-pin female cables | Connector fit and signal mapping for each connection |

The planned control path is sensor readings into the ESP32-S3, followed by authorized control signals from the ESP32-S3 to the BTS7960 module, which drives the Kamoer pump. GPIO assignments and a wiring diagram remain pending the interface details above. The listed 600 mL/min is a nominal product rating, not a calibrated value to hard-code as actual flow.

## Planned display workflow

1. Enter the target volume using a numeric keypad with Delete and Enter controls.
2. Show the required bottle size and wait for bottle detection before enabling dispense confirmation.
3. Let the user confirm or cancel, then show dispensing progress and an accessible Stop control while dispensing.
4. Ask the user to confirm the completed fill or indicate that more liquid is needed.
5. If more is needed, accept one bounded manual addition per tap, including when the button is held, and record the number of additions.
6. Record a confirmed outcome or a canceled/failed outcome and return to the entry screen.

Preventing overfill is a system requirement. The firmware must enforce bottle-capacity limits, sensor checks, and pump shutoff behavior, and these must be verified on the assembled system. Bottle-size thresholds and manual-addition amounts are not yet specified.

## Planned sensor and pump logic

The firmware will use a state machine to coordinate volume entry, waiting for a bottle, ready-to-dispense confirmation, dispensing, fill review, manual additions, and faults. Touchscreen actions request transitions; the control logic checks sensor conditions before permitting pump operation.

- Read and filter the break-beam bottle-detection input and load-cell measurements. Missing, stale, or invalid required sensor readings must prevent starting or stop an active dispense.
- Establish the bottle tare and validate the requested volume against the configured bottle capacity. Weight-based volume estimates require calibrated load-cell readings and the liquid's density; weight and volume must not be treated as interchangeable.
- Drive the pump through the motor driver only during an authorized dispense or bounded manual addition. Keep sensor checks and the Stop control responsive while the pump runs.
- Stop the pump on the configured target cutoff, bottle removal, Stop/Cancel, a sensor fault, or a maximum run-time limit. The cutoff method and allowance for liquid delivered after shutoff require physical calibration.
- Apply the same sensor and capacity checks to manual additions. A held button must not repeat additions, and requests must not accumulate into a queued burst while the pump is running.
- Default to a pump-off state at startup, reset, and fault recovery; require a fresh user confirmation before restarting. Verify the motor driver's default-off electrical behavior during hardware integration.
- Record the target, measured result when available, manual-addition count, and completion/cancellation/fault outcome. The storage method remains to be selected.

## Current milestone status

- Implemented: calculation/input validation, desktop record creation/cancellation/recovery, SQLite history with bounded retention, automated tests, and the earlier ESP32-S3 toolchain compilation check.
- M2 requirements and elicitation audit: [submission guide](docs/M2_SUBMISSION.md), [eight user stories and three measurable NFRs](docs/M2_REQUIREMENTS.md), and [AI elicitation audit](docs/M2_AI_ELICITATION_AUDIT.md). These documents specify planned behavior; this public milestone does not add the full application.
- M3 domain model and AI critique: [submission guide](docs/M3_SUBMISSION.md), [revised UML diagram and rationale](docs/M3_DOMAIN_MODEL.md), [untouched AI first draft](docs/ai/M3_DOMAIN_FIRST_DRAFT.md), and [structural critique](docs/M3_AI_MODEL_CRITIQUE.md). Diagram images and editable Mermaid source are included; application implementation is unchanged.
- M4 architecture decision: [ADR-001](docs/adr/ADR-001-durable-run-record.md) records the choice of one durable run record, two alternatives, and consequences; [submission guide](docs/M4_SUBMISSION.md) maps the evidence to the rubric. This formalizes the M3 design without adding persistence implementation.
- M5 walking skeleton: [screenshots and submission guide](docs/M5_SUBMISSION.md), with a real desktop request-to-storage path and [GitHub Actions workflow](.github/workflows/ci.yml).
- Planned: embedded touchscreen/state machine, sensor calibration, motor-driver control, additions/final-measurement logging, and hardware verification.
- The current calculation estimates time from a supplied flow rate; it does not control a pump or measure actual dispensed volume.

## Project layout

- `src/dispensing.js` contains the dispensing-time calculation.
- `src/volume.js` contains measurement validation.
- `src/run-history.js`, `src/sqlite-history.js`, and `src/server.js` implement the M5 domain, persistence, and HTTP layers.
- `web/` contains the M5 developer interface; `scripts/build.mjs` builds the desktop slice.
- `test/run-history.test.js` and `test/e2e/` exercise real persistence and the browser/restart path.
- `test/dispensing.test.js` contains the automated tests.
- `AI_LOG.md` records AI assistance and the resulting changes.
- `docs/` contains M2 requirements/audit and M3 domain-model/critique evidence, including original AI drafts.
- `docs/diagrams/` contains the M3 diagram image, SVG, editable Mermaid source, and rendering configuration.
- `docs/adr/` contains architecture decision records, beginning with ADR-001 for durable run data and recovery.
- `tools/esp32-check/` contains the compile-only embedded toolchain check and pinned library dependencies.
