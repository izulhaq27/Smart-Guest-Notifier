/**
 * SMART GUEST NOTIFIER - REPAIR SCRIPT V4.0
 * Fix: Data binding for V1, V2, V3 and Control Interaction
 */

var _AUTH = "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = "https://blynk.cloud/external/api";

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Dashboard Ready. Starting sync...");
    setupInteractiveControls();
    
    // Initial fetch and loop
    fetchBlynkData();
    setInterval(fetchBlynkData, 5000);
});

async function fetchBlynkData() {
    // Meminta semua data sekaligus
    const url = `${_URL}/get?token=${_AUTH}&V0&V1&V2&V3`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Status: " + response.status);
        
        const data = await response.json();
        console.log("📥 Data Blynk diterima:", data);

        // --- 1. Visitor Count (V0) ---
        const v0 = extractPinValue(data, 'V0', 0);
        document.getElementById('todayVisitorCount').textContent = v0 + '+';

        // --- 2. Jarak Sensor (V1) ---
        const v1 = extractPinValue(data, 'V1', 0);
        const distance = parseFloat(v1);
        const distEl = document.getElementById('sensorDistance');
        if (distEl) {
            distEl.textContent = (distance > 0 && distance < 500) ? distance.toFixed(1) + ' cm' : '-- cm';
        }

        // --- 3. Status Buzzer (V2) ---
        const v2 = extractPinValue(data, 'V2', 0);
        const buzEl = document.getElementById('buzzerStatus');
        if (buzEl) buzEl.textContent = parseInt(v2) ? 'ON' : 'OFF';

        // --- 4. Status LED (V3) ---
        const v3 = extractPinValue(data, 'V3', 0);
        const ledEl = document.getElementById('ledStatus');
        if (ledEl) ledEl.textContent = parseInt(v3) ? 'ON' : 'OFF';

        updateConnectionUI(true, "Connected to Blynk");

    } catch (err) {
        console.error("❌ Sync Error:", err);
        updateConnectionUI(false, "Offline - Reconnecting...");
    }
}

/**
 * Helper untuk mengambil nilai dari berbagai format response Blynk
 */
function extractPinValue(data, pin, fallback) {
    if (data === null || data === undefined) return fallback;
    
    // Jika format Object: { "V0": "4", "V1": "10" }
    if (typeof data === 'object' && !Array.isArray(data)) {
        return data[pin] !== undefined ? data[pin] : fallback;
    }
    
    // Jika format Array: ["4", "10", "0", "0"] (Sesuai urutan URL)
    if (Array.isArray(data)) {
        const indexMap = { 'V0': 0, 'V1': 1, 'V2': 2, 'V3': 3 };
        return data[indexMap[pin]] !== undefined ? data[indexMap[pin]] : fallback;
    }

    return data || fallback;
}

/**
 * Setup klik pada card untuk ON/OFF hardware
 */
function setupInteractiveControls() {
    // Mencari card pembungkus (metric-card)
    const buzzerStatus = document.getElementById('buzzerStatus');
    const ledStatus = document.getElementById('ledStatus');

    if (buzzerStatus) {
        const buzCard = buzzerStatus.closest('.metric-card');
        buzCard.style.cursor = "pointer";
        buzCard.onclick = async () => {
            const current = buzzerStatus.textContent === 'ON' ? 0 : 1;
            console.log("Sending Buzzer Update:", current);
            await fetch(`${_URL}/update?token=${_AUTH}&V2=${current}`);
            setTimeout(fetchBlynkData, 500);
        };
    }

    if (ledStatus) {
        const ledCard = ledStatus.closest('.metric-card');
        ledCard.style.cursor = "pointer";
        ledCard.onclick = async () => {
            const current = ledStatus.textContent === 'ON' ? 0 : 1;
            console.log("Sending LED Update:", current);
            await fetch(`${_URL}/update?token=${_AUTH}&V3=${current}`);
            setTimeout(fetchBlynkData, 500);
        };
    }
}

function updateConnectionUI(online, msg) {
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    if (badge) badge.className = online ? 'connection-status connected' : 'connection-status';
    if (text) text.textContent = msg;
}
