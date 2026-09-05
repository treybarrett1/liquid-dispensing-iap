# ESP32-S3 toolchain check

This small project checks that the development computer can compile and link C++
with Arduino-ESP32, LVGL, LovyanGFX, the GT911 touch library, and the HX711 library.
It is an installation check, not the dispenser application. It assigns no sensor,
pump, display, or touch pins, and does not initialize those devices.

From the repository root, run:

```powershell
$env:PYTHONUTF8 = "1"
pio --version
pio run -d tools/esp32-check
pio pkg list -d tools/esp32-check
pio device list
```

`pio run` builds locally; it does not upload. A successful build verifies the
compiler and library compatibility, not the physical screen, sensors, or pump.
No connected board is needed. `pio device list` may be empty until a board is
connected and recognized by Windows.

The UTF-8 setting prevents Windows encoding errors when the package tree or build
metrics are captured through a pipe or transcript.

If an already-open terminal cannot find `pio` after installation, refresh its PATH:

```powershell
$env:Path += ";$env:USERPROFILE\.platformio\penv\Scripts"
```

Restart VS Code after first installing the tools. For PlatformIO's project UI,
open this directory (`tools/esp32-check`) as the PlatformIO project.

The pinned platform and display-library versions follow
[ELECROW's V1.2/V1.3 example configuration](https://github.com/Elecrow-RD/CrowPanel-Advance-5-HMI-ESP32-S3-AI-Powered-IPS-Touch-Screen-800x480/blob/master/example/V1.2_and_V1.3/PlatformIO/platformio.ini).
The generic ESP32-S3 build target is configured for 16 MB flash and octal PSRAM.
This does not confirm the physical PCB revision or select its initialization code.
Before creating deployable firmware, confirm the revision and adopt its matching
board configuration, display initialization, and LVGL version.

The HX711 dependency is the
[bogde HX711 Arduino library](https://github.com/bogde/HX711).
Break-beam input and BTS7960 control will use GPIO/PWM APIs once their wiring is
verified; this check does not configure either device.

## Local installation verification (2026-09-04)

- PlatformIO IDE extension: 3.3.4; Core tools: 6.1.19.
- Isolated Python: 3.11.15; system Python remains available separately.
- ESP32 platform: pioarduino 55.3.39; Arduino-ESP32: 3.3.9.
- Xtensa C++ compiler: GCC 14.2.0; GDB: 17.1; esptool: 5.3.0.
- LVGL 9.1.0, LovyanGFX 1.2.26, TAMC_GT911 1.0.2, HX711 0.7.5.
- The check compiled and linked successfully, generating `firmware.bin`.
- The separate JavaScript prototype's 12 tests passed.
- No serial device was detected; no upload or hardware test was performed.

The platform installer also adds the pioarduino Core distribution. Dependency
updates initially exceeded the Core constraints for Uvicorn and Click; Uvicorn
0.40.0 and Click 8.3.3 satisfy the installed tools. If repairing this installation,
use the isolated environment rather than changing system Python:

```powershell
& "$env:USERPROFILE\.platformio\penv\Scripts\python.exe" -m pip check
```
