# 🚀 QUICK START GUIDE - Smart Guest Notifier Analytics Website

## 5 Menit Setup! ⚡

### Prerequisite
✅ Arduino ESP32 sudah terprogram  
✅ Arduino terkoneksi ke Blynk  
✅ Sudah memiliki Auth Token Blynk  
✅ Server web sudah running (Laragon/XAMPP)

---

## STEP 1: Update File Konfigurasi

### A. Update `script.js`
Buka file `script.js` dan cari bagian ini (baris ~10):

```javascript
const BLYNK_CONFIG = {
    AUTH_TOKEN: 'vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0',  // ← GANTI INI
    TEMPLATE_ID: 'TMPL6gaw4vA0v',                    // ← GANTI INI
    DEVICE_ID: 'YOUR_DEVICE_ID',                     // ← GANTI INI
    // ... rest of config
};
```

**Cara mendapatkan credentials:**
1. Buka https://blynk.cloud
2. Login dengan akun Blynk Anda
3. Pilih Device → Smart Guest Notifier
4. Klik "Device Info" atau settings icon
5. Copy nilai berikut:
   - **BLYNK_AUTH_TOKEN**: "Auth Token"
   - **TEMPLATE_ID**: "Template ID"
   - **DEVICE_ID**: "Device ID"

### B. Update Arduino Code (Optional)
Edit file `arduino-code.ino` baris ~7-9:

```cpp
#define BLYNK_AUTH_TOKEN "YOUR_TOKEN_HERE"
// ... dan ubah WiFi credentials
char ssid[] = "WiFi Anda";
char pass[] = "Password WiFi Anda";
```

---

## STEP 2: Copy Files ke Web Server

**Untuk Laragon:**
```
C:\laragon\www\Smart Guest Notifier Analytics Module\website\
├── index.html
├── style.css
├── script.js
├── config.js
└── README.md
```

**Untuk XAMPP:**
```
C:\xampp\htdocs\smart-guest-notifier\
├── index.html
├── style.css
├── script.js
└── config.js
```

---

## STEP 3: Buka Website

Buka browser dan akses:
- **Laragon**: http://localhost/Smart%20Guest%20Notifier%20Analytics%20Module/website/
- **XAMPP**: http://localhost/smart-guest-notifier/

Atau buka file `index.html` secara langsung: `File → Open → index.html`

---

## STEP 4: Verifikasi Koneksi

Buka **DevTools** (Tekan F12) → Console tab:

✅ Harus ada pesan:
```
🚀 Smart Guest Notifier Analytics Module Loaded
✅ System initialized
⚙️ Configuration loaded successfully
```

❌ Jika ada error seperti "API Error 401":
- Cek kembali Auth Token
- Pastikan token tidak ada space/typo

---

## STEP 5: Test Sistem

### Test 1: Manual Refresh
- Tekan tombol "🔄 Refresh Data"
- Atau tekan keyboard **"R"**

### Test 2: Simulasi Deteksi
- Tekan keyboard **"T"** untuk simulasi pengunjung baru
- Lihat total pengunjung naik
- Lihat activity log update
- Lihat notifikasi pop-up

### Test 3: Real Device
- Letakkan tangan di depan sensor Arduino
- Tunggu 2-3 detik
- Lihat apakah angka naik di website

---

## ✨ Fitur yang Sudah Ready

| Fitur | Status | Cara Pakai |
|-------|--------|-----------|
| Dashboard Real-time | ✅ | Otomatis update setiap 3 detik |
| Chart Visualization | ✅ | Lihat tab "Dashboard Analytics" |
| Activity Log | ✅ | Scroll di bawah halaman |
| Mobile Responsive | ✅ | Test buka di mobile |
| Dark Theme | ✅ | Designed dengan tema gelap |
| Notification | ✅ | Pop-up saat ada pengunjung |

---

## 🎨 Customization

### Ubah Warna
Edit `style.css` baris ~8-30, ubah nilai hex color:
```css
--primary-color: #FF6B35;  /* Orange - ubah warna sini */
```

### Ubah Refresh Interval
Edit `script.js` baris ~13:
```javascript
REFRESH_INTERVAL: 3000,  // 3 detik, ubah jadi 5000 untuk 5 detik
```

### Ubah Notifikasi Message
Edit `script.js`, cari `triggerNotification()`:
```javascript
notification.textContent = '👥 Pengunjung baru terdeteksi!';  // Ubah teks
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Status: Offline** | 1. Cek internet connection<br>2. Pastikan Arduino online di Blynk<br>3. Refresh page (F5) |
| **API Error 401** | Ganti Auth Token di script.js |
| **API Error 404** | Ganti DEVICE_ID di script.js |
| **Font tidak tampil** | Pastikan internet aktif (font dari Google) |
| **Chart tidak muncul** | Clear browser cache (Ctrl+Shift+Delete) |
| **Tombol tidak berfungsi** | Buka Console (F12) cek error messages |

---

## 📚 File Details

| File | Fungsi | Edit Jika |
|------|--------|-----------|
| **index.html** | Struktur website | Ingin tambah fitur |
| **style.css** | Desain & warna | Ingin ubah tampilan |
| **script.js** | Logika & Blynk API | Ingin ubah behavior |
| **config.js** | Konfigurasi | Ingin customize settings |
| **README.md** | Dokumentasi lengkap | Butuh referensi |

---

## 🧪 Testing Shortcuts

Tekan di keyboard saat website terbuka:

| Key | Function |
|-----|----------|
| **R** | Refresh data manual |
| **T** | Test/Simulasi deteksi pengunjung |
| **F12** | Buka Developer Console |

---

## 📞 Tips & Tricks

1. **Monitor Console**: Tekan F12 untuk lihat debugging logs
2. **Inspect Element**: Klik kanan → Inspect untuk lihat struktur
3. **Mobile Test**: Tekan F12 → Toggle device toolbar (Ctrl+Shift+M)
4. **Save Data**: Data tersimpan di localStorage browser
5. **Hard Refresh**: Ctrl+Shift+R untuk clear cache

---

## ✅ Checklist Sebelum Go Live

- [ ] Credentials Blynk sudah diupdate
- [ ] Arduino sudah terprogram dan online
- [ ] Website bisa diakses
- [ ] Status menunjukkan "Terhubung"
- [ ] Test simulasi visitor (tekan T)
- [ ] Real test dengan sensor fisik
- [ ] Responsive di mobile (tekan Ctrl+Shift+M)
- [ ] Console tidak ada error (tekan F12)

---

## 🎉 Selesai!

Website Anda sudah siap digunakan! Nikmati fitur monitoring pengunjung real-time dengan dashboard yang cantik.

**Feedback & Suggestions?** Lihat README.md untuk info lebih lanjut.

---

**Version**: 1.0.0  
**Updated**: May 2026  
**Status**: Production Ready ✅
