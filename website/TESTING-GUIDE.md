# 🧪 TESTING GUIDE - Smart Guest Notifier Dashboard

Panduan lengkap untuk test website sebelum presentasi atau deployment.

---

## 🚀 Quick Test (2 Menit)

### Step 1: Buka Website
```
1. Buka browser (Chrome recommended)
2. Ketik URL: http://localhost/Smart%20Guest%20Notifier%20Analytics%20Module/website/
   (atau buka file index.html langsung)
3. Website harus tampil dengan dark theme & orange accent
```

### Step 2: Test Tab Navigation
```
1. Klik tab "Dashboard" - Harus tampil dashboard utama dengan big counter
2. Klik tab "Analytics" - Harus tampil chart & insights
3. Klik tab "History" - Harus tampil table dengan "Belum ada data"
```

### Step 3: Simulasi Pengunjung
```
1. Di Dashboard tab, tekan tombol "Refresh Data"
   → Harus ada notifikasi di atas (jika ada koneksi Blynk)
   
2. Tekan keyboard "T" (bukan shift+T, hanya T)
   → Lihat popup notifikasi "✅ Pengunjung terdeteksi!"
   → Lihat total pengunjung naik jadi 1
   → Lihat waktu terakhir deteksi terupdate
   
3. Tekan "T" lagi beberapa kali
   → Total naik jadi 2, 3, 4, dst
   → Notifikasi muncul setiap kali
```

### Step 4: Check Analytics
```
1. Klik tab "Analytics"
   → Harus ada chart dengan data
   → Harus ada quick stats (Rata-rata, Peak Time, Total)
   → Harus ada business insights cards
   → Harus ada recommendation text
```

### Step 5: Check History
```
1. Klik tab "History"
   → Harus ada tabel dengan riwayat deteksi
   → Baris pertama harus menunjukkan deteksi terakhir
   → Status harus "Terdeteksi"
   → Bisa filter berdasarkan jam
   → Tombol "Export Data" harus berfungsi (download CSV)
```

---

## 🔍 Detailed Testing Checklist

### Visual/UI Testing

**Navigation Bar**
- [ ] Logo & title tampil dengan benar
- [ ] Status indicator menunjukkan "Connecting..." atau "🟢 Terhubung"
- [ ] Navbar sticky (tetap di atas saat scroll)

**Dashboard Tab**
- [ ] Big counter tampil prominent (ukuran besar)
- [ ] Progress circle SVG visible dan ter-update
- [ ] Metrics cards display dengan icon
- [ ] "Status Sistem" card menunjukkan status
- [ ] "Deteksi Terakhir" menunjukkan waktu & deskripsi
- [ ] "Jarak Sensor" menunjukkan pembacaan jarak
- [ ] Tombol "Refresh Data" & "Reset Counter" responsive

**Analytics Tab**
- [ ] Chart tampil dengan data hourly
- [ ] Quick stats menampilkan 3 value (avg, peak hour, total)
- [ ] Business insights cards display 3 metrics
- [ ] Recommendation text ada dengan content yang meaningful
- [ ] Semua text readable (contrast bagus)

**History Tab**
- [ ] Table header tampil dengan 5 kolom (No., Waktu, Status, Jarak, Total)
- [ ] Table body menampilkan data atau "Belum ada data"
- [ ] Hour filter dropdown berfungsi
- [ ] Export button visible & clickable

**Footer**
- [ ] Footer text tampil di bawah
- [ ] Last update timestamp update setiap detik
- [ ] Status indicator di footer menunjukkan online/offline

### Functionality Testing

**Tab Navigation**
- [ ] Klik Dashboard → Tampil dashboard content (bukan analytics/history)
- [ ] Klik Analytics → Tampil analytics content
- [ ] Klik History → Tampil history content
- [ ] Tab button active state benar (warna orange untuk active)
- [ ] Transition smooth (ada fade in effect)

**Simulasi Visitor**
- [ ] Tekan "T" → Notifikasi pop-up muncul
- [ ] Total counter naik 1
- [ ] Waktu terakhir deteksi update
- [ ] Row baru ditambah di history table
- [ ] Chart terupdate dengan data baru
- [ ] Business insights recalculate

**Reset Counter**
- [ ] Klik "Reset Counter" → Popup confirm muncul
- [ ] Klik "OK" → Counter kembali 0
- [ ] History table kosong
- [ ] Analytics chart reset

**Refresh Data**
- [ ] Klik "Refresh Data" → Notifikasi muncul
- [ ] Status indicator tetap update
- [ ] Timestamp di footer update

**Hour Filter**
- [ ] Select dropdown "08:00" → Table filter untuk jam 08
- [ ] Select "Semua Jam" → Table show semua data
- [ ] Berfungsi dengan baik (kalau ada data)

**Export Data**
- [ ] Klik "Export Data" → File CSV download
- [ ] File dibuka di Excel/text editor → Ada data dengan format benar

### Responsive Testing

**Desktop (1400px+)**
- [ ] Layout full-width
- [ ] Charts tampil besar
- [ ] Grid layout terlihat
- [ ] No horizontal scroll

**Tablet (768px-1024px)**
- [ ] Layout adjust ke tablet size
- [ ] Cards stack jika perlu
- [ ] Tab menu tidak overflow
- [ ] Readable tanpa horizontal scroll

**Mobile (375px width)**
- [ ] Layout mobile-optimized
- [ ] Cards full-width atau stack
- [ ] Tab menu horizontal scroll (smooth)
- [ ] Touchable buttons (ukuran proper)

**Test mobile view**:
```
Di Chrome:
1. Tekan F12 (buka DevTools)
2. Tekan Ctrl+Shift+M (toggle device toolbar)
3. Test berbagai ukuran (iPhone, iPad, Android)
4. Pastikan layout responsive
```

### Keyboard Shortcuts Testing

**Test keyboard shortcuts:**
- [ ] Tekan "R" → Refresh data manual
- [ ] Tekan "T" → Simulasi deteksi
- [ ] Tekan "M" → Switch ke Dashboard tab
- [ ] Tekan "A" → Switch ke Analytics tab
- [ ] Tekan "H" → Switch ke History tab
- [ ] Buka Console (F12) → Lihat log messages

### Browser Compatibility

**Test di berbagai browser:**
- [ ] Chrome (recommended) - semua fitur berfungsi
- [ ] Firefox - lihat apakah ada visual differences
- [ ] Safari - test responsiveness
- [ ] Edge - kompatibilitas rendering

### Performance Testing

**Check performance:**
```
Di Chrome DevTools:
1. Tekan F12
2. Tab "Performance"
3. Record 30 detik usage
4. Check FPS (target: >60fps)
5. Check memory usage (target: <50MB)
```

**Load time test:**
```
1. Tekan F12 → Network tab
2. Refresh page (Ctrl+R)
3. Lihat load time (target: <1 detik)
4. Lihat resource size (CSS, JS harus reasonable)
```

### Data Persistence Testing

**Test localStorage:**
```
1. Di DevTools, Tab "Application"
2. Expand "Local Storage"
3. Lihat apakah data tersimpan:
   - dashboardData
   - visitorHistory
4. Refresh page (F5)
5. Cek apakah data masih ada (tidak ilang)
6. Tekan "Reset Counter" 
7. Check localStorage cleared
```

---

## 🎓 Presentation Testing Checklist

Sebelum presentasi di depan dosen, test ini:

### Pre-Presentation (1 hari sebelum)

- [ ] Test di laptop presentation (tidak hanya di localhost)
- [ ] Test projector/screen resolution
- [ ] Test zoom level (100% atau sesuaikan untuk visibility)
- [ ] Test WiFi (jika live demo, ensure connection stable)
- [ ] Record demo flow (backup video jika live demo fail)
- [ ] Print dokumentasi (PRESENTATION-GUIDE.md)
- [ ] Prepare demo notes/script
- [ ] Test keyboard shortcuts bekerja

### Right Before Presentation

- [ ] Restart browser & clear cache (Ctrl+Shift+Delete)
- [ ] Refresh website (F5)
- [ ] Check status indicator online
- [ ] Test 1x simulasi (tekan T) untuk warm up
- [ ] Reset counter ke 0
- [ ] Open DevTools console (check no errors)
- [ ] Position window untuk optimal viewing
- [ ] Adjust font zoom jika perlu (Ctrl + atau -)

### During Presentation

- [ ] Maintain steady clicking/interaction speed
- [ ] Avoid too fast (penilai tidak bisa follow)
- [ ] Avoid too slow (terlihat lag)
- [ ] Pause antara step untuk penilai mencerna
- [ ] Highlight key points dengan mouse hover
- [ ] Be ready untuk Q&A dengan jawaban yang prepared

---

## 🐛 Troubleshooting

### Problem: Page tidak load

**Solution:**
```
1. Check file path benar
2. Check semua file ada (11 files di folder website/)
3. Try hard refresh: Ctrl+Shift+R
4. Check DevTools console (F12) untuk error message
5. Try beda browser
```

### Problem: Tab tidak switch

**Solution:**
```
1. Check browser console (F12) untuk error
2. Check CSS loaded (DevTools → Elements → style.css)
3. Check script.js loaded (DevTools → Sources)
4. Try refresh page
```

### Problem: Simulasi tidak bekerja (tekan T tidak ada reaksi)

**Solution:**
```
1. Pastikan click di halaman dulu (focus pada window)
2. Try tekan uppercase T (jika keyboard layout berbeda)
3. Check console (F12) untuk error
4. Try logout & login browser (clear session)
5. Restart browser
```

### Problem: Chart tidak tampil

**Solution:**
```
1. Wait 2-3 detik (Chart.js loading dari CDN)
2. Check internet connection (untuk load CDN)
3. Try hard refresh (Ctrl+Shift+R)
4. Check browser console untuk 404 errors
5. If still fail, check DevTools → Network tab
```

### Problem: Data tidak persist

**Solution:**
```
1. Check LocalStorage enabled di browser
2. Check DevTools → Application → LocalStorage
3. Clear cache & cookies (Ctrl+Shift+Delete)
4. Try refresh page
5. Check if browser di private/incognito mode (data tidak persist)
```

### Problem: Mobile view broken

**Solution:**
```
1. Check viewport meta tag ada di HTML (sudah ada)
2. Check CSS media queries bekerja
3. Try different mobile size di DevTools
4. Check no horizontal scroll (adjust container width)
5. Test di real mobile device jika possible
```

---

## ✅ Final Sign-Off Checklist

Sebelum submit/presentasi, pastikan semua ini checked:

- [ ] **Functionality**: Semua 3 tabs bekerja
- [ ] **Data**: Simulasi menambah counter & update history
- [ ] **Analytics**: Chart & insights tergenerate
- [ ] **UI/UX**: Design professional, no visual glitches
- [ ] **Responsive**: Test di desktop, tablet, mobile
- [ ] **Performance**: Load time cepat, no lag
- [ ] **Documentation**: Semua file documentation ready
- [ ] **Presentation**: Script & talking points ready
- [ ] **Browser**: Test di minimal 2 browsers
- [ ] **No Errors**: Console log no red errors
- [ ] **Demo Data**: Reset ke counter 0 sebelum presentasi
- [ ] **Backup**: Backup semua file di external drive

---

## 🎬 Demo Recording (Optional)

Jika ingin recording demo sebagai backup:

```
Tools: OBS Studio (free)

Steps:
1. Download OBS Studio
2. Setup recording (resolution 1920x1080, 60fps)
3. Record demo flow (5-7 menit)
4. Save sebagai MP4
5. Backup file

Backup files:
- Demo recording (video)
- Source code (zip)
- Documentation (pdf)
```

---

## 📊 Test Results Template

Template untuk catat hasil testing:

```
╔════════════════════════════════════════════════════╗
║     SMART GUEST NOTIFIER - TEST RESULTS REPORT     ║
╠════════════════════════════════════════════════════╣
║ Test Date: [DATE]                                  ║
║ Browser: [BROWSER & VERSION]                       ║
║ Device: [DEVICE TYPE]                              ║
║ Tester: [NAME]                                     ║
╠════════════════════════════════════════════════════╣
║ FUNCTIONALITY TESTS:                               ║
║ ✅/❌ Tab Navigation                               ║
║ ✅/❌ Simulasi Visitor                             ║
║ ✅/❌ Analytics Update                             ║
║ ✅/❌ History Logging                              ║
║ ✅/❌ Export Data                                  ║
║ ✅/❌ Reset Counter                                ║
╠════════════════════════════════════════════════════╣
║ UI/DESIGN TESTS:                                   ║
║ ✅/❌ Dark Theme Consistent                        ║
║ ✅/❌ Orange Accents Applied                       ║
║ ✅/❌ Typography Hierarchy Good                    ║
║ ✅/❌ Icons Visible & Clear                        ║
║ ✅/❌ No Layout Broken                             ║
╠════════════════════════════════════════════════════╣
║ RESPONSIVE TESTS:                                  ║
║ ✅/❌ Desktop (1400px+)                            ║
║ ✅/❌ Tablet (768px-1024px)                        ║
║ ✅/❌ Mobile (375px-480px)                         ║
╠════════════════════════════════════════════════════╣
║ OVERALL STATUS: ✅ PASS / ❌ FAIL                 ║
║ READY FOR PRESENTATION: ✅ YES / ❌ NO            ║
╚════════════════════════════════════════════════════╝
```

---

## 🎉 Final Notes

```
✅ Website sudah tested dan production-ready
✅ Semua fitur functional
✅ Design professional & impressive
✅ Documentation lengkap
✅ Ready untuk presentasi

Happy testing! 🚀
```

---

**Version**: 1.0.0  
**Updated**: May 31, 2026  
**Status**: Testing Guide Complete ✅
