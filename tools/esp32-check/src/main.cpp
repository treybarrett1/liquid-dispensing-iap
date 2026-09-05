// Compile-only installation check. No display, sensor, or pump pins are assigned.
#include <Arduino.h>
#include <HX711.h>
#include <LovyanGFX.hpp>
#include <TAMC_GT911.h>
#include <lvgl.h>

void setup() {
    Serial.begin(115200);
    lv_init();
    Serial.printf("Toolchain check: LVGL %d.%d.%d; HX711 type size %u bytes\n",
                  LVGL_VERSION_MAJOR, LVGL_VERSION_MINOR, LVGL_VERSION_PATCH,
                  static_cast<unsigned>(sizeof(HX711)));
}

void loop() {
    delay(1000);
}
