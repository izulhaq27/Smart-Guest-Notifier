/**
 * SMART GUEST NOTIFIER - FINAL STABLE SCRIPT
 * Version: 3.0 (Full Control & Sync)
 */

// 1. Konfigurasi
var _AUTH = (typeof BLYNK_AUTH_TOKEN !== 'undefined') ? BLYNK_AUTH_TOKEN : "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = (typeof BLYNK_API_BASE_URL !== 'undefined') ? BLYNK_API_BASE_URL : "https://blynk.cloud/external/api";

const PINS = {
    visitor: "V0",
    distance: "V1",
    buzzer: "V2",
    led: "V3"
};

// State
let appState = {
    deviceOnline: false,
    buzzerOn: false,
    ledOn: false
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 System Loading...");
    
    setupClickHandlers();
    
    // Polling data
    fetchData();
    setInterval(fetchData, 5000);
});

// Setup Klik pada Card untuk kontrol Hardware
function setupClickHandlers() {
    const buzzerCard = document.getElementById('buzzerStatus').closest('.metric-card');
    const ledCard = document.getElementById('ledStatus').closest('.metric-card');

    if (buzzerCard) {
        buzzerCard.style.cursor = "pointer";
        buzzerCard.onclick = () => {
            const newState = appState.buzzerOn ? 0 : 1;
            sendUpdate(PINS.buzzer, newState);
        };
    }

    if (ledCard) {
        ledCard.style.cursor = "pointer";
        ledCard.onclick = () => {
            const newState = appState.ledOn ? 0 : 1;
            sendUpdate(PINS.led, newState);
        };
    }
}

// Fungsi Ambil Data (GET)
async function fetchData() {
    const url = `${_URL}/get?token=${_AUTH}&${PINS.visitor}&${PINS.distance}&${PINS.buzzer}&${PINS.led}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Offline");

        const data = await response.json();
        console.log("📥 Dashboard Data:", data);

        // Update Status Online
        updateStatusUI(true, "Connected to Blynk");

        // 1. Update Visitor (V0)
        const count = data[PINS.visitor] || 0;
        document.getElementById('todayVisitorCount').textContent = count + '+';

        // 2. Update Jarak (V1)
        const dist = parseFloat(data[PINS.distance]) || 0;
        document.getElementById('sensorDistance').textContent = dist > 0 ? dist + ' cm' : '-- cm';

        // 3. Update Buzzer (V2)
        const buz = parseInt(data[PINS.buzzer]) || 0;
        appState.buzzerOn = !!buz;
        document.getElementById('buzzerStatus').textContent = buz ? 'ON' : 'OFF';

        // 4. Update LED (V3)
        const led = parseInt(data[PINS.led]) || 0;
        appState.ledOn = !!led;
        document.getElementById('ledStatus').textContent = led ? 'ON' : 'OFF';

    } catch (err) {
        console.warn("⚠️ Sync failed:", err.message);
        updateStatusUI(false, "Offline - Reconnecting...");
    }
}

// Fungsi Kirim Perintah (WRITE)
async function sendUpdate(pin, value) {
    const url = `${_URL}/update?token=${_AUTH}&${pin}=${value}`;
    try {
        console.log(`📤 Sending ${pin} = ${value}`);
        await fetch(url);
        // Refresh data langsung agar UI berubah cepat
        fetchData(); 
    } catch (err) {
        alert("Gagal mengirim perintah ke hardware");
    }
}

function updateStatusUI(isOnline, message) {
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    const sys   = document.getElementById('systemStatusText');

    if (badge) {
        if (isOnline) badge.classList.add('connected');
        else badge.classList.remove('connected');
    }
    if (text) text.textContent = message;
    if (sys) sys.textContent = isOnline ? "Online" : "Offline";
}
