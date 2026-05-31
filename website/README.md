# Smart Guest Notifier Analytics Module - Website Documentation

## 📋 Daftar Isi
1. [Overview](#overview)
2. [Struktur Folder](#struktur-folder)
3. [Setup & Installation](#setup--installation)
4. [Konfigurasi Blynk](#konfigurasi-blynk)
5. [Integrasi Arduino](#integrasi-arduino)
6. [Fitur Website](#fitur-website)
7. [Tips & Troubleshooting](#tips--troubleshooting)

---

## 📌 Overview

Website Analytics Module untuk **Smart Guest Notifier** - sistem monitoring pengunjung berbasis sensor jarak dengan IoT Blynk. Website ini menampilkan data real-time dari Arduino dan menyediakan dashboard analytics lengkap.

### Teknologi yang Digunakan:
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: Blynk Cloud API
- **Chart Library**: Chart.js
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Design**: Dark Theme dengan Orange Accent

---

## 📁 Struktur Folder

```
website/
├── index.html          # File HTML utama
├── style.css           # Stylesheet CSS
├── script.js           # JavaScript logika
├── README.md           # Dokumentasi (file ini)
└── config.js           # Konfigurasi Blynk (opsional)
```

---

## 🚀 Setup & Installation

### 1. **Persiapan Awal**
- Sudah memiliki device Arduino dengan sensor ultrasonic
- Sudah membuat akun Blynk dan upload kode Arduino
- Sudah mendapatkan Auth Token dari Blynk

### 2. **Setup Website**
```bash
# 1. Copy folder website ke web server (Laragon, XAMPP, dll)
# 2. Buka file config.js dan update konfigurasi
# 3. Buka index.html di browser
```

### 3. **Konfigurasi Blynk**
Edit bagian BLYNK_CONFIG di file `script.js`:

```javascript
const BLYNK_CONFIG = {
    AUTH_TOKEN: 'vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0',  // Token Anda
    TEMPLATE_ID: 'TMPL6gaw4vA0v',                     // Template ID
    API_BASE_URL: 'https://blynk.cloud/external/api',
    DEVICE_ID: 'YOUR_DEVICE_ID',                      // Ganti dengan ID device
    VIRTUAL_PIN_VISITOR: 'V0',                        // Pin untuk visitor count
    REFRESH_INTERVAL: 3000,                           // Refresh 3 detik
};
```

---

## 🔧 Konfigurasi Blynk

### Langkah 1: Dapatkan Auth Token
1. Buka **Blynk Console** (https://blynk.cloud)
2. Login ke akun Anda
3. Pilih **Device** → Smart Guest Notifier
4. Klik **Device Info** / **Settings**
5. Copy **Auth Token** (contoh: `vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0`)

### Langkah 2: Update Konfigurasi Website
```javascript
// Di dalam script.js, update:
BLYNK_CONFIG.AUTH_TOKEN = 'TOKEN_ANDA_DI_SINI'
```

### Langkah 3: Test Koneksi
1. Buka browser Developer Tools (F12)
2. Lihat Console untuk log messages
3. Pesan "✅ System initialized" artinya berhasil

---

## 🔌 Integrasi Arduino

### Virtual Pin Mapping
Website menggunakan virtual pins berikut:

| Pin | Tujuan | Arduino Variable |
|-----|--------|-----------------|
| V0 | Total Pengunjung | `visitorCount` |
| V1 | Jarak Sensor (cm) | `distance` |
| V2 | Status Alarm | `alarmStatus` |

### Contoh Kode Arduino untuk Kirim Data ke Blynk

```cpp
// Kirim total pengunjung ke V0
void kirimDataBlynk() {
  Blynk.virtualWrite(V0, visitorCount);
  
  // Kirim jarak ke V1
  Blynk.virtualWrite(V1, distance);
}

// Di dalam loop()
void loop() {
  Blynk.run();
  
  distance = readDistance();
  
  if (distance > 5 && distance < 100) {
    visitorCount++;
    kirimDataBlynk();
    delay(2000);  // Debounce
  }
}
```

### URL Endpoint Blynk API

```javascript
// GET visitor count
https://blynk.cloud/external/api/v1/get/V0?token=YOUR_TOKEN

// SET nilai
https://blynk.cloud/external/api/v1/set/V0?value=123&token=YOUR_TOKEN

// GET device info
https://blynk.cloud/external/api/v1/info?token=YOUR_TOKEN
```

---

## ✨ Fitur Website

### 1. **Real-Time Dashboard**
- Menampilkan total pengunjung yang terdeteksi
- Status koneksi device (Terhubung/Offline)
- Waktu deteksi terakhir
- Jarak sensor saat ini

### 2. **Analytics Chart**
- Visualisasi pengunjung per jam (12 jam terakhir)
- Menampilkan peak time
- Rata-rata pengunjung per jam

### 3. **Activity Log**
- Mencatat setiap deteksi pengunjung
- Timestamp setiap event
- Status dan jarak terukur

### 4. **Responsive Design**
- Bekerja di desktop, tablet, mobile
- Dark theme yang nyaman di mata
- Orange accent sesuai brand

---

## 🎨 Customization

### Mengubah Warna Theme
Edit file `style.css`, bagian `:root`:

```css
:root {
    --primary-color: #FF6B35;        /* Ganti warna orange */
    --background: #0D0D0D;           /* Ganti background */
    --text-primary: #FFFFFF;         /* Ganti warna text */
    /* ... */
}
```

### Mengubah Refresh Interval
Edit di `script.js`:

```javascript
REFRESH_INTERVAL: 3000  // Ubah jadi 5000 untuk 5 detik, dll
```

### Menambah Virtual Pin Baru
1. Edit `script.js` - tambah pin baru di BLYNK_CONFIG
2. Buat fungsi fetch untuk pin baru
3. Update UI HTML untuk menampilkan data

---

## 🧪 Testing & Debugging

### Mode Testing (Simulasi)
Tekan **"T"** di keyboard untuk simulasi deteksi pengunjung baru.

### Refresh Manual
Tekan **"R"** di keyboard untuk manual refresh data.

### Console Logs
Buka DevTools (F12) → Console untuk melihat:
- ✅ Pesan sukses
- ❌ Error messages
- 📊 Data yang diterima dari Blynk

---

## ⚠️ Troubleshooting

### Problem: "API Error: 401"
**Solusi**: Auth Token salah atau expired
- Verify token di Blynk Console
- Update kembali di `script.js`

### Problem: Data tidak update
**Solusi**: 
1. Check koneksi internet
2. Pastikan Arduino dinyalakan dan terhubung Blynk
3. Periksa apakah V0 mendapat data dari Arduino

### Problem: Website tidak load
**Solusi**:
1. Pastikan folder `website/` di web server
2. Akses via `http://localhost/website/` (jika Laragon)
3. Check browser console (F12) untuk error

### Problem: Font tidak tampil
**Solusi**: 
1. Pastikan internet connection aktif (Plus Jakarta Sans dari Google Fonts)
2. Jika offline, download font lokal

---

## 📱 Mobile Responsive

Website otomatis responsive di semua ukuran:
- **Desktop**: Full features
- **Tablet**: Layout optimal
- **Mobile**: Compact view dengan button stack

---

## 🔐 Security Notes

⚠️ **PENTING**:
- Jangan expose Auth Token di public repository
- Gunakan environment variables untuk production
- Recommend: Setup backend API proxy untuk keamanan lebih

---

## 📚 Referensi

- **Blynk Documentation**: https://docs.blynk.io/
- **Blynk API Reference**: https://docs.blynk.io/en/blynk-cloud/https-api-overview
- **Chart.js Documentation**: https://www.chartjs.org/
- **Google Fonts**: https://fonts.google.com/

---

## 📞 Support

Jika ada pertanyaan atau kendala:
1. Check dokumentasi di atas
2. Baca Blynk documentation
3. Periksa console browser untuk error messages

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Author**: Smart Guest Notifier Development Team
