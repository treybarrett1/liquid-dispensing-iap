# ADR-002 - Prove the run-history slice through a desktop storage adapter

Date: 2026-10-01. Status: accepted for the M5 development slice; does not replace the planned embedded target.

## Context

M5 needs a real request through the architecture to storage and back, with build/test CI and visible evidence. The public repository has a JavaScript calculation prototype and a planned C++/Arduino/LVGL target. M2 US-07 AC3 permits a developer interface for local history; M3 and ADR-001 define durable identity/recovery. No serial board was detected during this task. Invented sensor readings would not prove the requested storage path.

## Decision

Use browser HTML/JavaScript, a loopback Node.js 24 HTTP adapter, domain validation/lifecycle operations, and a real SQLite file. Implement creating a Pending **recovery record**, reading it back, cancelling it, and recovering it as Failed/interrupted on server restart. Creating this record is not an authorized fill. No sensor interlock is bypassed because there is no pump-control path.

The same record ID spans Pending and terminal states, as ADR-001 specifies. SQLite transactions commit before success responses, enforce one pending record, and retain 50 terminal records plus one pending record. A serial record sequence determines oldest-first eviction. Measurements are explicitly unavailable; this slice has no additions or confirmed physical fills to report.

Node 24 supplies the built-in SQLite API. Esbuild produces executable server/browser outputs, and Playwright drives the production build. CI uses Ubuntu/Node 24 and installs Chromium. This is a desktop adapter, not a claim that this JavaScript runs on ESP32 or that SQLite is the eventual embedded backend.

## Alternatives and consequences

- **ESP32 touchscreen/Serial plus device storage:** closest to the planned deployment and necessary to prove LVGL/Arduino/device-storage integration. It requires an accessible board and verified configuration. It remains an integration task rather than mocked hardware presented as evidence now.
- **Browser localStorage or an in-memory server:** simpler to demonstrate, but would omit the service/domain/file-storage boundaries selected for this slice. In-memory persistence would also fail the process-restart test.

This choice enables repeatable UI-to-disk tests and CI without hardware. Its cost is another adapter and future integration with C++ and embedded storage. It raises the desktop minimum from Node 18 to Node 24. It proves neither ESP32 timing nor electrical power-loss behavior: process termination is not a flash-chip power interruption. WAL/FULL synchronization is a SQLite setting, not independent proof of the physical NFRs.

Only one server process may own a database. This local developer service has no multi-user access model and is not intended for public hosting. Addition records, final measurements, Confirmed outcomes, calibration, and actuator control remain outside this slice. Another physical backend can implement ADR-001 later without changing its logical identity/recovery decision.
