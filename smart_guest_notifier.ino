// =====================================================
//  SMART GUEST NOTIFIER — ESP32
//  Blynk Virtual Pins:
//    V0 = visitorCount  (Integer)
//    V1 = distance cm   (Double)
//    V2 = buzzerStatus  (Integer 0/1)
//    V3 = ledStatus     (Integer 0/1)
// =====================================================

#define BLYNK_TEMPLATE_ID   "TMPL6gaw4vA0v"
#define BLYNK_TEMPLATE_NAME "Smart Guest Notifier Analytics Module"
#define BLYNK_AUTH_TOKEN    "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0"

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- Konfigurasi WiFi ---
char auth[] = BLYNK_AUTH_TOKEN;
char ssid[] = "KERIS indihome";
char pass[] = "angetsari";

// --- Konfigurasi Telegram ---
String botToken = "8857908066:AAF47_ZJIZfV3LGkbn0sT3ODswhMCbrvRyQ";
String chatId   = "8518288985";

// --- Pin ---
const int trigPin   = 5;
const int echoPin   = 18;
const int buzzerPin = 19;
const int ledPin    = 23;

// --- LCD I2C ---
LiquidCrystal_I2C lcd(0x27, 16, 2);

// --- Variabel Global ---
int  visitorCount = 0;
long duration;
int  distance;

// -------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(trigPin,   OUTPUT);
  pinMode(echoPin,   INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin,    OUTPUT);

  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Notifier");
  lcd.setCursor(0, 1);
  lcd.print("Menghubungkan...");

  Blynk.begin(auth, ssid, pass);

  // Kirim nilai awal ke Blynk setelah connect
  Blynk.virtualWrite(V0, visitorCount);
  Blynk.virtualWrite(V1, 0);
  Blynk.virtualWrite(V2, 0);
  Blynk.virtualWrite(V3, 0);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ada Orang Masuk:");
  lcd.setCursor(0, 1);
  lcd.print(visitorCount);

  Serial.println("Koneksi Sukses! Sistem Siap!");
}

// -------------------------------------------------------
int readDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration  = pulseIn(echoPin, HIGH, 30000);
  int dist  = duration * 0.034 / 2;
  return (dist == 0) ? 999 : dist;
}

// -------------------------------------------------------
void sendTelegram(String message) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = "https://api.telegram.org/bot" + botToken +
               "/sendMessage?chat_id=" + chatId + "&text=" + message;

  http.begin(client, url);
  int httpCode = http.GET();

  if (httpCode > 0) {
    Serial.println("Notifikasi Telegram Terkirim!");
  } else {
    Serial.print("Gagal Kirim Telegram. HTTP: ");
    Serial.println(httpCode);
  }
  http.end();
}

// -------------------------------------------------------
void loop() {
  Blynk.run();

  distance = readDistance();

  // Selalu kirim jarak real-time ke V1 (polling tiap loop)
  // Hanya kirim jika jarak valid (bukan 999 = timeout)
  if (distance < 999) {
    Blynk.virtualWrite(V1, distance);
  } else {
    Blynk.virtualWrite(V1, 0);
  }

  // ---- Deteksi Pengunjung ----
  if (distance > 5 && distance < 100) {
    visitorCount++;

    // 1. Update LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);

    // 2. Nyalakan LED + Buzzer → kirim V2=1, V3=1 ke Blynk
    Blynk.virtualWrite(V2, 1); // Buzzer ON
    Blynk.virtualWrite(V3, 1); // LED ON

    for (int i = 0; i < 3; i++) {
      digitalWrite(ledPin, HIGH);
      tone(buzzerPin, 2000);
      delay(100);
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
      delay(100);
    }

    // 3. Matikan LED + Buzzer → kirim V2=0, V3=0
    Blynk.virtualWrite(V2, 0); // Buzzer OFF
    Blynk.virtualWrite(V3, 0); // LED OFF

    // 4. Kirim jumlah pengunjung ke V0
    Blynk.virtualWrite(V0, visitorCount);

    // 5. Telegram
    String pesan = "Tamu%20Masuk!%0ATotal%20pengunjung%20saat%20ini:%20"
                   + String(visitorCount) + "%20orang.";
    sendTelegram(pesan);

    Serial.print("Pengunjung Terdeteksi! Total: ");
    Serial.println(visitorCount);

    // 6. Jeda anti-double count
    delay(2000);

    // 7. Tampilkan kembali hitungan terakhir di LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);
  }

  delay(200); // sedikit jeda agar tidak flood Blynk
}
