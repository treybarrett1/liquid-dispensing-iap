# Liquid Dispensing Calculator

## Concept brief

The Liquid Dispensing Calculator is a small utility for people configuring pumps, fillers, or other liquid-dispensing equipment. A user supplies a target volume in milliliters and a flow rate in milliliters per minute, and the app calculates the expected dispensing time in minutes. This first milestone deliberately focuses on a single dependable calculation and rejects zero, negative, non-numeric, and non-finite measurements; later milestones could add a browser interface, unit conversion, calibration offsets, saved recipes, and comparisons between actual and expected dispense times.

## Declared stack

- Runtime and language: Node.js 18+ with modern JavaScript (ES modules)
- Package manager: npm
- Test runner: Vitest
- Version control and hosting: Git and GitHub
- AI coding tool: OpenAI Codex

## Setup and verification

Install the locked dependencies and run the test suite:

```sh
npm ci
npm test
```

To capture the complete toolchain evidence requested for the milestone, run:

```sh
node --version
npm --version
npm test
git status
```

A clean checkout should report passing tests and a clean Git working tree after these commands.

## Usage

```js
import { calculateDispenseTime } from './src/dispensing.js';

calculateDispenseTime(500, 100); // 5 minutes
```

Both arguments must be finite numbers greater than zero. Invalid measurements throw a `RangeError`.

## Project layout

- `src/dispensing.js` contains the dispensing-time calculation.
- `src/volume.js` contains measurement validation.
- `test/dispensing.test.js` contains the automated tests.
- `AI_LOG.md` records AI assistance and the resulting changes.
