# ESP32 Sensor Project

This project uses an **ESP32** with a **DHT sensor** (temperature & humidity) and an **MPU6050** (accelerometer + gyroscope).
It reads sensor values and prints them to the Serial Monitor.

## Components
- ESP32 DevKit
- DHT22
- MPU6050 accelerometer/gyroscope module
- Breadboard + jumper wires (testing phase)

## Wiring
- DHT22:
  - VCC -> 3.3V
  - GND -> GND
  - Data -> GPIO 4 (with 10kΩ pull-up resistor)

- MPU6050:
  - VCC -> 3.3V
  - GND -> GND
  - SDA -> GPIO 21
  - SCL -> GPIO 22

## Setup
### Breabboard Photo
![breadboard](docs/.........jpg)

### Wiring Diagram
![diagram](docs/.........jpg)

## Code
The Arduino sketch is in [/src/main.ino](src/main.ino).

## How to run
1. Install Arduino IDE and ESP32 board support.
2. Install required libraries:
    - `DHT sensor library`
    - `Adafruit Unified Sensor`
    - `MPU6050_light`
4. Upload the code to the ESP32.
5. Open Serial Monitor at `115200 baud`.

## Future Plans
- Send data over WiFi (MQTT or HTTP)
- Create a dashboard to visualize results (React, Next.js...)
