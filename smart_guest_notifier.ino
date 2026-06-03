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
char ssid[] = "Rosa";         
char pass[] = "ilhamrosa123"; 

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
int buzzerState = 0;
int ledState = 0;

// Handler untuk kontrol Buzzer dari Web (V2)
BLYNK_WRITE(V2) {
  buzzerState = param.asInt();
  if (buzzerState == 1) {
    tone(buzzerPin, 2000);
  } else {
    noTone(buzzerPin);
  }
  Serial.print("Buzzer dari Web: ");
  Serial.println(buzzerState);
}

// Handler untuk kontrol LED dari Web (V3)
BLYNK_WRITE(V3) {
  ledState = param.asInt();
  digitalWrite(ledPin, ledState ? HIGH : LOW);
  Serial.print("LED dari Web: ");
  Serial.println(ledState);
}

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

  // Gunakan server SGP1 agar stabil
  Blynk.begin(auth, ssid, pass, "sgp1.blynk.cloud", 80);
  
  // Kirim status awal ke Blynk agar tidak kosong (PENTING untuk Web)
  Blynk.virtualWrite(V0, visitorCount);
  Blynk.virtualWrite(V1, 0);
  Blynk.virtualWrite(V2, 0);
  Blynk.virtualWrite(V3, 0);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ada Orang Masuk:");
  lcd.setCursor(0, 1);
  lcd.print(visitorCount);
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
  http.GET(); 
  http.end();
}

void loop() {
  Blynk.run(); 
  distance = readDistance();

  // Update jarak ke Blynk V1 secara periodik (setiap 2 detik)
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 2000) {
    Blynk.virtualWrite(V1, (distance < 500) ? distance : 0);
    lastUpdate = millis();
  }

  if (distance > 5 && distance < 100) {
    visitorCount++; 
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);
    
    // Notifikasi Lokal
    for(int i = 0; i < 3; i++) {
      digitalWrite(ledPin, HIGH);
      tone(buzzerPin, 2000); 
      delay(100);
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
      delay(100);
    }

    // Kirim data ke Blynk
    Blynk.virtualWrite(V0, visitorCount);
    
    // Kirim Telegram
    String pesanTeks = "Tamu%20Masuk!%0ATotal%20pengunjung%20saat%20ini:%20" + String(visitorCount) + "%20orang.";
    sendTelegram(pesanTeks); 
    
    delay(2000); 
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ada Orang Masuk:");
    lcd.setCursor(0, 1);
    lcd.print(visitorCount);
  }
}
