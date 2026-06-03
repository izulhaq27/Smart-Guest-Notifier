/**
 * SMART GUEST NOTIFIER - FULL SYNC SCRIPT
 */

var _AUTH = "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = "https://blynk.cloud/external/api";

// State
let appState = {
    todayVisitors: 0,
    prevVisitorCount: -1,
    deviceOnline: false
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Dashboard Syncing...");
    
    // Tombol Refresh Manual
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchData);

    // Initial fetch
    fetchData();
    setInterval(fetchData, 5000);
});

async function fetchData() {
    // Ambil semua data sekaligus
    const url = `${_URL}/get?token=${_AUTH}&V0&V1&V2&V3`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Server Error");

        const json = await response.json();
        console.log("📥 Data:", json);

        // Blynk mengembalikan object jika multi-pin {V0: "4", V1: "25", ...}
        const count = parseInt(json.V0) || 0;
        const dist  = parseInt(json.V1) || 0;
        const buz   = parseInt(json.V2) || 0;
        const led   = parseInt(json.V3) || 0;

        // Update UI
        updateUIStatus(true, "Connected to Blynk");
        
        document.getElementById('todayVisitorCount').textContent = count + '+';
        document.getElementById('sensorDistance').textContent = dist > 0 ? dist + ' cm' : '-- cm';
        document.getElementById('buzzerStatus').textContent = buz ? 'ON' : 'OFF';
        document.getElementById('ledStatus').textContent = led ? 'ON' : 'OFF';

        appState.todayVisitors = count;
        appState.prevVisitorCount = count;

    } catch (err) {
        console.error("❌ Connection failed:", err);
        updateUIStatus(false, "Offline - Reconnecting...");
    }
}

function updateUIStatus(online, message) {
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    const sys   = document.getElementById('systemStatusText');

    if (badge) {
        badge.className = online ? 'connection-status connected' : 'connection-status';
    }
    if (text) text.textContent = message;
    if (sys) sys.textContent = online ? "Online" : "Offline";
}

// Dummy functions untuk chart agar tidak error
function updateAllDisplay() {}
function initializeCharts() {}
