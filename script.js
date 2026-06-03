/**
 * SMART GUEST NOTIFIER - RESILIENT SCRIPT
 * Focus: Reliability and Connection Debugging
 */

// 1. Get Config from config.js or fallback to user's verified token
var _AUTH = (typeof BLYNK_AUTH_TOKEN !== 'undefined') ? BLYNK_AUTH_TOKEN : "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = (typeof BLYNK_API_BASE_URL !== 'undefined') ? BLYNK_API_BASE_URL : "https://blynk.cloud/external/api";

console.log("🛠️ Using Token:", _AUTH);
console.log("🌐 Using URL:", _URL);

// State
let appState = {
    todayVisitors: 0,
    prevVisitorCount: -1,
    deviceOnline: false,
    visitorHistory: JSON.parse(localStorage.getItem('visitorHistory')) || []
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    updateUIStatus(false, "Menghubungkan...");
    
    // Initial fetch
    fetchData();
    
    // Polling every 5 seconds
    setInterval(fetchData, 5000);
});

async function fetchData() {
    // URL yang sudah dites user dan berhasil di tab baru
    const finalUrl = `${_URL}/get?token=${_AUTH}&V0`;
    
    try {
        const response = await fetch(finalUrl);
        
        if (!response.ok) {
            throw new Error("HTTP Error " + response.status);
        }

        const data = await response.text();
        console.log("📥 Data received:", data);

        // Parsing Blynk data (biasanya ["4"] atau 4)
        const cleanData = data.replace(/[\[\]\"]/g, '');
        const count = parseInt(cleanData) || 0;

        // Berhasil!
        appState.todayVisitors = count;
        updateUIStatus(true, "Connected to Blynk");
        
        // Update display
        const display = document.getElementById('todayVisitorCount');
        if (display) display.textContent = count + '+';

        // Deteksi pengunjung baru (lokal)
        if (appState.prevVisitorCount !== -1 && count > appState.prevVisitorCount) {
            showLocalNotification("👥 Pengunjung Baru Terdeteksi!");
        }
        appState.prevVisitorCount = count;

    } catch (err) {
        console.error("❌ Connection failed:", err);
        
        let msg = "Offline - Reconnecting...";
        if (err.message.includes('Failed to fetch')) {
            msg = "CORS / AdBlock Blocked";
        }
        
        updateUIStatus(false, msg);
    }
}

function updateUIStatus(online, message) {
    appState.deviceOnline = online;
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    const sys   = document.getElementById('systemStatusText');

    if (badge) {
        if (online) {
            badge.classList.add('connected');
            badge.style.backgroundColor = "rgba(78, 130, 238, 0.2)";
            badge.style.color = "#4e82ee";
        } else {
            badge.classList.remove('connected');
            badge.style.backgroundColor = "rgba(250, 112, 118, 0.2)";
            badge.style.color = "#fa7076";
        }
    }
    
    if (text) text.textContent = message;
    if (sys) sys.textContent = online ? "Online" : "Offline";
}

function showLocalNotification(msg) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'notification';
    div.innerHTML = `<span>🔔</span> <span>${msg}</span>`;
    container.appendChild(div);
    
    setTimeout(() => div.remove(), 3000);
}

// Dummy functions to prevent errors from other components
function initializeCharts() {}
function updateAllDisplay() {}
