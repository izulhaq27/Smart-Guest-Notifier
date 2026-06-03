// =====================================================
//  SMART GUEST NOTIFIER — ESP32 (FIXED VERSION)
//  Blynk Virtual Pins:
//    V0 = visitorCount  (Integer)
// =====================================================

#define BLYNK_TEMPLATE_ID "TMPL6gaw4vA0v"
#define BLYNK_TEMPLATE_NAME "Smart Guest Notifier Analytics Module"
#define BLYNK_AUTH_TOKEN "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0"

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BlynkSimpleEsp32.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- Konfigurasi WiFi & Blynk ---
char auth[] = BLYNK_AUTH_TOKEN;
char ssid[] = "Rosa";         // SUDAH DIUPDATE
char pass[] = "ilhamrosa123"; // SUDAH DIUPDATE

// --- Konfigurasi Telegram ---
String botToken = "8857908066:AAF47_ZJIZfV3LGkbn0sT3ODswhMCbrvRyQ"; 
String chatId = "8518288985";

// --- Konfigurasi Pin ---
const int trigPin = 5;
const int echoPin = 18;
const int buzzerPin = 19; 
const int ledPin = 23;    

// --- Inisialisasi LCD ---
LiquidCrystal_I2C lcd(0x27, 16, 2);

// --- Variabel Global ---
int visitorCount = 0;
long duration;
int distance;

void setup() {
  Serial.begin(115200);
  
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Notifier");
  lcd.setCursor(0, 1);
  lcd.print("Menghubungkan...");

  // FIX: Menggunakan server Singapore agar lebih stabil
  Blynk.begin(auth, ssid, pass, "sgp1.blynk.cloud", 80);
  
  // Tampilan awal saat sistem sudah siap
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ada Orang Masuk:");
  lcd.setCursor(0, 1);
  lcd.print(visitorCount);
  
  Serial.println("Koneksi Sukses! Sistem Siap!");
}

int readDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH, 30000); 
  int dist = duration * 0.034 / 2;
  return (dist == 0) ? 999 : dist; 
}

void sendTelegram(String message) {
  WiFiClientSecure client;
  client.setInsecure(); 
  HTTPClient http;
  
  String url = "https://api.telegram.org/bot" + botToken + "/sendMessage?chat_id=" + chatId + "&text=" + message;
  
  http.begin(client, url);
  int httpCode = http.GET(); 
  
  if (httpCode > 0) {
    Serial.println("Notifikasi Telegram Terkirim!");
  } else {
    Serial.print("Gagal Kirim Telegram. Error HTTP: ");
    Serial.println(httpCode);
  }
  http.end();
}

void loop() {
  Blynk.run(); 
  
  distance = readDistance();

  if (distance > 5 && distance < 100) {
    visitorCount++; 
    
    // 1. Perubahan Teks LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);
    
    // 2. Irama Notifikasi Lokal
    for(int i = 0; i < 3; i++) {
      digitalWrite(ledPin, HIGH);
      tone(buzzerPin, 2000); 
      delay(100);
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
      delay(100);
    }

    // 3. Kirim data ke Blynk Cloud
    Blynk.virtualWrite(V0, visitorCount);
    
    // 4. Kirim Pesan ke Telegram
    String pesanTeks = "Tamu%20Masuk!%0ATotal%20pengunjung%20saat%20ini:%20" + String(visitorCount) + "%20orang.";
    sendTelegram(pesanTeks); 
    
    Serial.print("Pengunjung Terdeteksi! Total: ");
    Serial.println(visitorCount);
    
    // 5. Jeda anti double-count
    delay(2000); 
    
    // 6. Standby LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);
  }
}
