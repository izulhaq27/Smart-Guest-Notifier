/**
 * KONFIGURASI BLYNK UNTUK WEBSITE
 * File ini berisi semua konfigurasi yang diperlukan untuk menghubungkan
 * website dengan Arduino dan Blynk Cloud
 * 
 * UPDATE DISINI sesuai dengan credentials Blynk Anda
 */

// ===================================
// BLYNK CREDENTIALS
// ===================================

const BLYNK_AUTH_TOKEN = 'vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0';
// 📝 GANTI DENGAN TOKEN ANDA dari Blynk Console

const BLYNK_TEMPLATE_ID = 'TMPL6gaw4vA0v';
// 📝 GANTI DENGAN TEMPLATE ID ANDA

const BLYNK_DEVICE_ID = ''; 
// Opsional: ID device Anda

// ===================================
// API CONFIGURATION
// ===================================

// Jika website tetap "Offline", coba ganti blynk.cloud dengan server regional Anda:
// - Singapore: sgp1.blynk.cloud
// - Europe:    fra1.blynk.cloud
// - US:        ny3.blynk.cloud
const BLYNK_API_BASE_URL = 'https://blynk.cloud/external/api';

const REFRESH_INTERVAL = 5000;
// Interval refresh data (5000 = 5 detik). Rekomendasi: 5000-10000ms untuk Blynk Free Plan.

// ===================================
// VIRTUAL PIN MAPPING
// ===================================
// Virtual pins yang digunakan untuk komunikasi Arduino ↔ Website

const VIRTUAL_PINS = {
    VISITOR_COUNT: 'V0',      // Total pengunjung yang terdeteksi
    DISTANCE: 'V1',           // Jarak sensor terukur (cm)
    ALARM_STATUS: 'V2',       // Status alarm (0/1)
    LED_STATUS: 'V3',         // Status LED (0/1)
    BUZZER_STATUS: 'V4',      // Status buzzer (0/1)
    TEMPERATURE: 'V5',        // Suhu (jika ada sensor tambahan)
    HUMIDITY: 'V6',           // Kelembaban (jika ada sensor tambahan)
};

// ===================================
// UI CONFIGURATION
// ===================================

const UI_CONFIG = {
    // Auto-refresh data dari Blynk
    AUTO_REFRESH: true,
    
    // Maksimal pengunjung untuk chart (untuk scale)
    MAX_VISITORS: 100,
    
    // Maksimal entries di activity log
    MAX_LOG_ENTRIES: 10,
    
    // Timeout untuk API calls (millisecond)
    API_TIMEOUT: 10000,
    
    // Show notifications
    SHOW_NOTIFICATIONS: true,
    
    // Auto-hide notification setelah berapa lama (millisecond)
    NOTIFICATION_DURATION: 3000,
};

// ===================================
// DISTANCE SENSOR CONFIGURATION
// ===================================

const SENSOR_CONFIG = {
    // Range deteksi jarak (dalam cm)
    MIN_DISTANCE: 5,           // Minimum jarak deteksi
    MAX_DISTANCE: 100,         // Maximum jarak deteksi
    
    // Untuk menghindari false trigger
    DEBOUNCE_TIME: 2000,       // 2 detik debounce
    
    // Kalibrasi jika diperlukan
    CALIBRATION_OFFSET: 0,     // Offset kalibrasi
};

// ===================================
// NOTIFICATION SETTINGS
// ===================================

const NOTIFICATION_CONFIG = {
    // Notifikasi ketika pengunjung terdeteksi
    ON_VISITOR_DETECTED: {
        enabled: true,
        message: '👥 Pengunjung baru terdeteksi!',
        sound: true,
        duration: 3000,
    },
    
    // Notifikasi ketika device offline
    ON_DEVICE_OFFLINE: {
        enabled: true,
        message: '⚠️ Device tidak terhubung',
        sound: false,
        duration: 5000,
    },
    
    // Notifikasi ketika device online kembali
    ON_DEVICE_ONLINE: {
        enabled: true,
        message: '✓ Device kembali terhubung',
        sound: true,
        duration: 3000,
    },
};

// ===================================
// THEME CONFIGURATION
// ===================================

const THEME_CONFIG = {
    // Warna utama
    PRIMARY_COLOR: '#FF6B35',
    PRIMARY_DARK: '#E85A2A',
    
    // Warna background
    BACKGROUND: '#0D0D0D',
    SURFACE: '#1a1a1a',
    SURFACE_LIGHT: '#252525',
    
    // Warna text
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#B0B0B0',
    TEXT_TERTIARY: '#808080',
    
    // Status colors
    SUCCESS_COLOR: '#4CAF50',
    WARNING_COLOR: '#FFC107',
    ERROR_COLOR: '#F44336',
    
    // Gradient
    GRADIENT_START: '#FF6B35',
    GRADIENT_END: '#FF8A50',
};

// ===================================
// STORAGE CONFIGURATION
// ===================================

const STORAGE_CONFIG = {
    // Gunakan localStorage untuk cache data
    USE_LOCAL_STORAGE: true,
    
    // Keys untuk localStorage
    STORAGE_KEYS: {
        VISITOR_COUNT: 'visitorCount',
        LAST_DETECTION: 'lastDetection',
        LAST_DISTANCE: 'lastDistance',
        DEVICE_STATUS: 'deviceStatus',
        ACTIVITY_LOG: 'activityLog',
    },
    
    // Waktu expire cache (millisecond)
    CACHE_EXPIRY: 300000, // 5 menit
};

// ===================================
// LOGGING CONFIGURATION
// ===================================

const LOG_CONFIG = {
    // Enable debug logging
    DEBUG: true,
    
    // Log level: 'verbose', 'info', 'warn', 'error'
    LOG_LEVEL: 'info',
    
    // Save logs ke localStorage
    SAVE_LOGS: false,
    
    // Maksimal logs yang disimpan
    MAX_LOG_HISTORY: 100,
};

// ===================================
// HELPER FUNCTION: Export Config
// ===================================

const CONFIG = {
    BLYNK_AUTH_TOKEN,
    BLYNK_TEMPLATE_ID,
    BLYNK_DEVICE_ID,
    BLYNK_API_BASE_URL,
    REFRESH_INTERVAL,
    VIRTUAL_PINS,
    UI_CONFIG,
    SENSOR_CONFIG,
    NOTIFICATION_CONFIG,
    THEME_CONFIG,
    STORAGE_CONFIG,
    LOG_CONFIG,
};

// Export untuk Node.js (jika digunakan dengan build tool)
// Dinonaktifkan untuk mencegah error SyntaxError di browser browser vanilla
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = CONFIG;
// }

console.log('⚙️ Configuration loaded successfully');
