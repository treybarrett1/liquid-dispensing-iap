# Liquid Dispenser Control Application

## Concept brief

This Individual App Project (IAP) will provide the touchscreen interface and embedded control logic for the liquid-dispensing system being developed in EECE 4991 Junior Design. Running on the ELECROW ESP32-S3 display board, the application will accept a target volume in milliliters, read the bottle-detection and load-cell sensors, operate the pump through its motor driver, show dispensing progress, and handle stop, cancel, and fault conditions. After dispensing, the user will confirm the fill or request small manual additions, with each completed tap requesting one bounded addition rather than continuous dispensing when held. The app will record outcomes and manual additions to support later calibration work. The individual software scope includes the screens, sensor processing, dispensing sequence, and pump-control logic; hardware selection, wiring, and mechanical assembly are part of the broader Junior Design system. The current repository provides an initial calculation and validation module with automated tests; the embedded interface, sensor drivers, and pump control are planned work.

## Declared stack

Planned embedded control application:

- Hardware: ELECROW CrowPanel Advance 5.0-inch HMI, ESP32-S3, 800 x 480 IPS touchscreen (manufacturer model DIS02050A).
- Processor and memory: dual-core Xtensa LX7 up to 240 MHz, 512 KB SRAM, 8 MB PSRAM, and 16 MB flash.
- Proposed firmware stack: C++ with the Arduino framework and LVGL for the touchscreen interface.
- Proposed build and dependency tooling: PlatformIO in VS Code, starting from ELECROW's example for the matching hardware revision.
- Version control and hosting: Git and GitHub.
- AI coding tool: OpenAI Codex.

Current calculation prototype and verified desktop toolchain:

- Runtime and language: Node.js 18+ with modern JavaScript (ES modules)
- Package manager: npm
- Test runner: Vitest
- Version control and hosting: Git and GitHub
- AI coding tool: OpenAI Codex

The JavaScript code currently runs on the development computer. The proposed C++/LVGL firmware has not been implemented or built in this repository, and the existing Vitest results verify only the JavaScript calculation prototype. Embedded build and test evidence still needs to be collected when that toolchain is set up.

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

- Implemented: dispensing-time calculation, input validation, automated tests, and project documentation.
- Planned: touchscreen screens, embedded dispensing state machine, sensor acquisition and calibration, motor-driver control, simulated sensor/state tests, hardware verification, and outcome logging.
- The current calculation estimates time from a supplied flow rate; it does not control a pump or measure actual dispensed volume.

## Project layout

- `src/dispensing.js` contains the dispensing-time calculation.
- `src/volume.js` contains measurement validation.
- `test/dispensing.test.js` contains the automated tests.
- `AI_LOG.md` records AI assistance and the resulting changes.
