/**
 * SMART GUEST NOTIFIER ANALYTICS MODULE
 * Arduino Code untuk ESP32 dengan Sensor Ultrasonic
 * 
 * Konfigurasi:
 * - ESP32 Dev Module
 * - Baud Rate: 115200
 * - Library: Blynk, WiFi
 * 
 * Sensor:
 * - Trigger Pin: GPIO 5
 * - Echo Pin: GPIO 18
 * - Buzzer Pin: GPIO 21
 * - LED Pin: GPIO 22
 */

// ===================================
// BLYNK CONFIGURATION
// ===================================

#define BLYNK_TEMPLATE_ID "TMPL6gaw4vA0v"
#define BLYNK_TEMPLATE_NAME "Smart Guest Notifier Analytics Module"
#define BLYNK_AUTH_TOKEN "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>

// ===================================
// WIFI CONFIGURATION
// ===================================

char auth[] = BLYNK_AUTH_TOKEN;
char ssid[] = "KERIS indihome";      // GANTI DENGAN SSID WiFi ANDA
char pass[] = "angetsari";           // GANTI DENGAN PASSWORD WiFi ANDA

// ===================================
// PIN CONFIGURATION
// ===================================

const int trigPin = 5;               // Sensor Trigger
const int echoPin = 18;              // Sensor Echo
const int buzzerPin = 21;            // Buzzer
const int ledPin = 22;               // LED Indicator

// ===================================
// VARIABEL
// ===================================

int visitorCount = 0;                // Total pengunjung
long duration;                       // Durasi pulse
int distance;                        // Jarak terukur (cm)
int lastDistance = 0;                // Jarak sebelumnya
unsigned long lastDetectionTime = 0; // Waktu deteksi terakhir
unsigned long debounceTime = 2000;   // Debounce 2 detik

// Virtual Pins untuk Blynk
#define VIRTUAL_PIN_VISITOR V0       // Total pengunjung
#define VIRTUAL_PIN_DISTANCE V1      // Jarak sensor
#define VIRTUAL_PIN_ALARM V2         // Status alarm
#define VIRTUAL_PIN_LED V3           // Status LED
#define VIRTUAL_PIN_BUZZER V4        // Status buzzer

// ===================================
// SETUP
// ===================================

void setup() {
  // Inisialisasi Serial untuk debugging
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("====================================");
  Serial.println("Smart Guest Notifier Analytics Module");
  Serial.println("====================================");
  
  // Konfigurasi pin
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  
  // Inisialisasi awal
  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);
  
  Serial.println("\n[SYSTEM] Pin Configuration Complete");
  
  // Blynk connection
  Serial.println("[WiFi] Connecting to: " + String(ssid));
  Blynk.begin(auth, ssid, pass);
  
  Serial.println("[SYSTEM] System Ready!");
  Serial.println("====================================\n");
}

// ===================================
// MAIN LOOP
// ===================================

void loop() {
  if (Blynk.connected()) {
    Blynk.run();
  }
  
  // Baca jarak dari sensor
  distance = readDistance();
  
  // Logika deteksi pengunjung
  // Range: 5cm sampai 100cm
  if (distance > 5 && distance < 100) {
    // Cek debounce untuk menghindari multiple trigger
    if (millis() - lastDetectionTime > debounceTime) {
      // Pengunjung terdeteksi!
      visitorCount++;
      lastDetectionTime = millis();
      
      // Kirim data ke Blynk
      kirimDataBlynk();
      
      // Trigger notifikasi visual & audio
      triggerNotification();
      
      // Log ke Serial Monitor
      Serial.print("[DETECTION] Visitor Count: ");
      Serial.print(visitorCount);
      Serial.print(" | Distance: ");
      Serial.print(distance);
      Serial.println(" cm");
    }
  }
  
  // Update jarak terakhir ke Blynk (setiap loop)
  if (distance != lastDistance) {
    lastDistance = distance;
    Blynk.virtualWrite(VIRTUAL_PIN_DISTANCE, distance);
  }
  
  delay(100); // Debounce loop
}

// ===================================
// FUNCTION: Baca Jarak dari Sensor
// ===================================

int readDistance() {
  // Clear trigger pin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Send pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read echo pulse
  duration = pulseIn(echoPin, HIGH, 30000); // Timeout 30ms
  
  // Calculate distance
  // Speed of sound = 0.034 cm/microsecond
  // Distance = (duration * 0.034) / 2
  int dist = duration * 0.034 / 2;
  
  // Validasi jarak (return 999 jika error)
  return (dist == 0 || dist > 500) ? 999 : dist;
}

// ===================================
// FUNCTION: Kirim Data ke Blynk
// ===================================

void kirimDataBlynk() {
  if (Blynk.connected()) {
    // Kirim total pengunjung ke V0
    Blynk.virtualWrite(VIRTUAL_PIN_VISITOR, visitorCount);
    
    // Kirim jarak ke V1
    Blynk.virtualWrite(VIRTUAL_PIN_DISTANCE, distance);
    
    // Kirim status alarm ke V2
    Blynk.virtualWrite(VIRTUAL_PIN_ALARM, 1); // Alarm aktif
    
    // Log ke console
    Serial.println("[BLYNK] Data sent successfully!");
  } else {
    Serial.println("[BLYNK] Connection lost!");
  }
}

// ===================================
// FUNCTION: Trigger Notifikasi
// ===================================

void triggerNotification() {
  // Notifikasi visual & audio (3x blink & beep)
  for (int i = 0; i < 3; i++) {
    // LED ON + Buzzer ON
    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 2000); // Frekuensi 2000 Hz (nyaring)
    delay(150);
    
    // LED OFF + Buzzer OFF
    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);
    delay(150);
  }
  
  // Kirim notifikasi ke aplikasi Blynk
  if (Blynk.connected()) {
    Blynk.notify("Pengunjung baru terdeteksi! Total: " + String(visitorCount));
  }
}

// ===================================
// BLYNK VIRTUAL PIN HANDLERS
// ===================================

// Handler untuk read V0 (Visitor Count)
BLYNK_READ(VIRTUAL_PIN_VISITOR) {
  Blynk.virtualWrite(VIRTUAL_PIN_VISITOR, visitorCount);
}

// Handler untuk read V1 (Distance)
BLYNK_READ(VIRTUAL_PIN_DISTANCE) {
  Blynk.virtualWrite(VIRTUAL_PIN_DISTANCE, distance);
}

// Handler untuk write V2 (Alarm Control)
BLYNK_WRITE(VIRTUAL_PIN_ALARM) {
  int alarmState = param.asInt();
  if (alarmState == 1) {
    // Alarm ON - trigger notifikasi
    triggerNotification();
  } else {
    // Alarm OFF
    digitalWrite(ledPin, LOW);
    noTone(buzzerPin);
  }
}

// Handler untuk write V3 (LED Control)
BLYNK_WRITE(VIRTUAL_PIN_LED) {
  int ledState = param.asInt();
  digitalWrite(ledPin, ledState);
}

// Handler untuk write V4 (Buzzer Control)
BLYNK_WRITE(VIRTUAL_PIN_BUZZER) {
  int buzzerState = param.asInt();
  if (buzzerState == 1) {
    tone(buzzerPin, 2000); // On
  } else {
    noTone(buzzerPin); // Off
  }
}

// Ketika Blynk terhubung
BLYNK_CONNECTED() {
  Serial.println("[BLYNK] Connected to Blynk Cloud!");
  
  // Sync virtual pins
  Blynk.syncVirtual(VIRTUAL_PIN_VISITOR, VIRTUAL_PIN_DISTANCE);
}

// ===================================
// DEBUG FUNCTION
// ===================================

void printDebugInfo() {
  Serial.println("\n=== DEBUG INFO ===");
  Serial.print("Visitor Count: ");
  Serial.println(visitorCount);
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");
  Serial.print("Blynk Connected: ");
  Serial.println(Blynk.connected() ? "YES" : "NO");
  Serial.println("==================\n");
}

// ===================================
// CATATAN PENTING
// ===================================

/*
1. GANTI KONFIGURASI WIFI:
   - ssid[] = "Nama WiFi Anda"
   - pass[] = "Password WiFi Anda"

2. VERIFIKASI PIN:
   - trigPin = GPIO 5
   - echoPin = GPIO 18
   - buzzerPin = GPIO 21
   - ledPin = GPIO 22
   
   SESUAIKAN dengan wiring fisik Anda!

3. BLYNK SETUP:
   - Auth token sudah ada di konfigurasi
   - Pastikan app Blynk sudah dibuat dengan virtual pins
   - Download library Blynk: Sketch → Include Library → Manage Libraries

4. TESTING:
   - Open Serial Monitor (115200 baud)
   - Periksa log saat sistem startup
   - Test dengan menempatkan tangan di depan sensor
   - Lihat apakah counter naik dan notifikasi muncul

5. TROUBLESHOOTING:
   - Jika tidak connect WiFi: cek SSID & password
   - Jika sensor tidak baca: cek koneksi pin & wiring
   - Jika Blynk tidak terkoneksi: cek internet & auth token
*/
