ESP32                      MPU6050 (GY-521)
3.3V  -------------------> VCC
GND   -------------------> GND
GPIO21 (SDA) ------------> SDA
GPIO22 (SCL) ------------> SCL
                           AD0 -> leave unconnected
                           XDA, XCL, INT -> leave unconnected

ESP32                      DHT22 Module
3.3V  -------------------> VCC
GND   -------------------> GND
GPIO4 -------------------> DATA

ESP32                      LEDs
GPIO19 ------------------> Anode (Green LED) -> 220Ω -> GND
GPIO17 ------------------> Anode (Orange LED) -> 220Ω -> GND
GPIO16 ------------------> Anode (Red LED) -> 220Ω -> GND

ESP32                      Push Button
GPIO23 ------------------> Button pin
GND ---------------------> Button pin