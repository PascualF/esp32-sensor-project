#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <Wire.h>
#include "MPU6050_light.h"

// --- WiFi ---
const char* WIFI_SSID = WIFI_NAME;
const char* WIFI_PASSWORD = WIFI_PASSWORD;

// --- Firebase ---
#define API_KEY FIREBASE_API_KEY
#define DATABASE_URL FIREBASE_URL_PROJECT

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- Sensors ---
#define DHTPIN 4
#define DHTTYPE DHT22

// --- LEDS define ---
#define GREEN_LED 19
#define ORANGE_LED 17
#define RED_LED 16

// --- Define Button ---
#define BUTTON_PIN 23

DHT dht(DHTPIN, DHTTYPE);
MPU6050 mpu(Wire);

// --- State variables --- Button + MPU
bool mpuEnabled = false; //global

// --- Check if ESP32 is still alive ---
const unsigned long DAILY_INTERVAL = 24UL * 60UL * 60UL * 1000UL; // 24h
unsigned long lastDaily = 0;

void sendDataToFirebase(const char* path, FirebaseJson &json){
  const int maxRetries = 3;
  int attempt = 0;
  bool success = false;

  while (attempt < maxRetries && !success) {
    attempt++;

    if(WiFi.status() != WL_CONNECTED){
      Serial.println("WiFi not connected, retrying WiFi...");
      WiFi.reconnect();
      delay(1000);
      continue; // try again 
    }
    
    if(Firebase.RTDB.pushJSON(&fbdo, path, &json)){
      Serial.printf("Data sent to %s (attemp %d)\n", path, attempt);
      success = true;
    } else {
      String err = fbdo.errorReason();
      Serial.printf("Firebase error (attempt %d): %s\n", attempt, err.c_str());

      if(err.indexOf("token is  not ready") >= 0 || err.indexOf("expired") >= 0 || err.indexOf("revoked") >= 0) {
        Serial.println("Auth token problem detected - reauth...");
        if(Firebase.signUp(&config, &auth, "", "")) {
          Serial.println("Resignup sucessful.");
        } else {
          Serial.printf("Resignup failed: %s\n", config.signer.signupError.message.c_str());
        }
        delay(500);
        Firebase.begin(&config, &auth);
        Firebase.reconnectWiFi(true);
      } else {
        delay(1000); // it will wait a bit before retrying....
      }
    }
  }

  if (!success){
    Serial.println("Failed to send data after 3 retries, skipping this round. ");
  }
}

// Log vibrations
void logVibrationEvent(String level, float magnitude) {
  FirebaseJson json;
  json.set("level",  level);
  json.set("magnitude", magnitude);
  json.set("timestamp", time(nullptr));

  if(WiFi.status() == WL_CONNECTED) {
    sendDataToFirebase("device/device01/vibration_events", json);
  }
}

float readMagnitude(){
  mpu.update();
  float ax = mpu.getAccX();
  float ay = mpu.getAccY();
  float az = mpu.getAccZ();
  return sqrt(ax*ax + ay*ay + az*az);
}

void sendHeartbeat() {
  FirebaseJson json;
  json.set("status", "alive");
  json.set("timestamp", time(nullptr));
  sendDataToFirebase("device/device01/heartbeat", json);
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(ORANGE_LED, HIGH);
  digitalWrite(RED_LED, HIGH);
  delay(2000);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(ORANGE_LED, LOW);
  digitalWrite(RED_LED, LOW);
}

// Wi-Fi
void initWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
 
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

void handleButton() {
  static bool lastStableState = HIGH;
  static unsigned long lastDebounceTime = 0;
  const unsigned long debounceDelay = 50;

  int reading = digitalRead(BUTTON_PIN);
  Serial.printf("Raw reading: %d\n", reading);

  if (reading != lastStableState) {
    lastDebounceTime = millis();
    Serial.printf("State changed, debounce started ar %lu\n", lastDebounceTime);
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    Serial.printf("Tiem diff: %lu\n", millis() - lastDebounceTime);
    static int buttonState = HIGH;
    if (reading != buttonState) {
      buttonState = reading;
      if(buttonState == LOW) {
        mpuEnabled = !mpuEnabled;  // toggle
        Serial.printf("Button pressed -> mpuEnabled = %d\n", mpuEnabled);

        if (mpuEnabled) {
          digitalWrite(GREEN_LED, HIGH);
          Serial.println("MPU6050 ENABLED");
        } else {
          digitalWrite(GREEN_LED, LOW);
          digitalWrite(ORANGE_LED, LOW);
          digitalWrite(RED_LED, LOW);
          Serial.println("MPU6050 OFF");
        }
      }
    }
    
  }
  lastStableState = reading;
  Serial.printf("Button reading: %d, mpuEnabled: %d\n", reading, mpuEnabled);
}

void setup() {
  Serial.begin(115200);

  initWiFi();
  
  //--- Setud LEDs ---
  pinMode(GREEN_LED, OUTPUT);
  pinMode(ORANGE_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  
  // make sure they start OFF
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(ORANGE_LED, LOW);
  digitalWrite(RED_LED, LOW); 

  // NTP Setup
  configTime(0, 0, "pool.ntp.org");;
  struct tm timeinfo;
  while(!getLocalTime(&timeinfo)) {
    delay(1000);
    Serial.println("Waiting for NTP time");
  }

  Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");

  // Firebase Config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if(Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase anonymous sign-up sucessful!");
  } else {
    Serial.printf("Firebase sign-up error: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Init sensors
  Wire.begin();
  mpu.begin();
  mpu.calcOffsets();
  delay(100);
  dht.begin();

  // --- Send startud hearbeat ---
  sendHeartbeat();
  lastDaily = millis();
}

// --- Config for averaging the temp and hum ---
// A way of getting less data points
const unsigned long AVG_INTERVAL = 15 * 60 * 1000; // 15 min in ms
unsigned long lastAvgTime = 0;
float tempSum = 0, humSum = 0;
int sampleCount = 0;

/* // --- Config about magnitude ---
const unsigned long VIB_AVG_INTERVAL = 30 * 60 * 1000; */

// --- Vibration thresholds ---
const float ORANGE_THRESHOLD = 2.0; // g
const float RED_THRESHOLD = 4.0; // g

bool inAlarm = false;

void loop() {

  handleButton(); // Better check the button frequently, or I'll need to press it longer...

  static unsigned long lastSensorRead = 0;
  const unsigned long SENSOR_INTERVAL = 5000; // 5 seconds

  // Reading sensors only every 5 seconds.
  if((millis() - lastSensorRead) >= SENSOR_INTERVAL) {
    // Read values
    float temp = dht.readTemperature();
    delay(200);
    float hum = dht.readHumidity();
    Serial.print("Temp: "); Serial.println(temp);
    Serial.print("Hum: "); Serial.println(hum);

    // --- Just add temp and hum to the sum if all good ---
    if(!isnan(temp) && !isnan(hum)) {
      tempSum += temp;
      humSum += hum;
      sampleCount++;
    }

    // --- Check if 15 minutes passed ---
    if(millis() - lastAvgTime >= AVG_INTERVAL && sampleCount > 0) {
      float avgTemp = tempSum / sampleCount;
      float avgHum = humSum / sampleCount;

      FirebaseJson json;
      json.set("avgTemp", avgTemp);
      json.set("avgHum", avgHum);
      json.set("timestamp", time(nullptr));

      if(WiFi.status() == WL_CONNECTED) {
        sendDataToFirebase("device/device01/averages", json);
      }

      // --- reset buffer---
      tempSum = 0; humSum = 0; sampleCount = 0;
      lastAvgTime = millis();
    }
  }

  if(mpuEnabled){
    /// --- Vibration detection ---
    float magnitude = readMagnitude();

    // --- LED Logic ---  GREEN on/off on when button on/off
    if(magnitude >= ORANGE_THRESHOLD && magnitude < RED_THRESHOLD){
      digitalWrite(GREEN_LED, LOW);
      digitalWrite(ORANGE_LED, HIGH);
      digitalWrite(RED_LED, LOW);
    } else if (magnitude >= RED_THRESHOLD) {
      digitalWrite(GREEN_LED, LOW);
      digitalWrite(ORANGE_LED, LOW);
      digitalWrite(RED_LED, HIGH);
    } else {
      digitalWrite(ORANGE_LED, LOW);
      digitalWrite(RED_LED, LOW);
    }

    if (!inAlarm && magnitude >= RED_THRESHOLD) {
      logVibrationEvent("RED", magnitude);
      inAlarm = true;
    }
    else if (!inAlarm && magnitude >= ORANGE_THRESHOLD) {
      logVibrationEvent("ORANGE", magnitude);
      inAlarm = true;
    }
    else if (inAlarm && magnitude < ORANGE_THRESHOLD) {
      logVibrationEvent("RESOLVED", magnitude);
      inAlarm = false;
    }

    digitalWrite(GREEN_LED, HIGH);

    Serial.print("Magnitude: "); Serial.println(magnitude);
  }

  if(millis() - lastDaily >= DAILY_INTERVAL) {
    sendHeartbeat();
    lastDaily = millis();
  }

  delay(10); // delay changed, small delay to prevent watchdog issues.
}