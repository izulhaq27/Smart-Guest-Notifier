/**
 * SMART GUEST NOTIFIER - FINAL V3.1
 * Sinkronisasi penuh V0, V1, V2, V3
 */

var _AUTH = "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = "https://blynk.cloud/external/api";

document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    fetchBlynkData();
    setInterval(fetchBlynkData, 4000); // Refresh tiap 4 detik
});

async function fetchBlynkData() {
    // Ambil semua datastream sekaligus
    const url = `${_URL}/get?token=${_AUTH}&V0&V1&V2&V3`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Offline");
        
        const data = await response.json();
        
        // Update UI secara detail
        // 1. Visitor (V0)
        document.getElementById('todayVisitorCount').textContent = (data.V0 || 0) + '+';
        
        // 2. Jarak (V1 - Double)
        const distance = parseFloat(data.V1) || 0;
        document.getElementById('sensorDistance').textContent = distance > 0 ? distance.toFixed(1) + ' cm' : '-- cm';
        
        // 3. Buzzer (V2)
        const buz = parseInt(data.V2) || 0;
        document.getElementById('buzzerStatus').textContent = buz ? 'ON' : 'OFF';
        
        // 4. LED (V3)
        const led = parseInt(data.V3) || 0;
        document.getElementById('ledStatus').textContent = led ? 'ON' : 'OFF';

        updateStatus(true, "Connected to Blynk");

    } catch (err) {
        updateStatus(false, "Offline - Reconnecting...");
    }
}

// Fungsi agar card bisa diklik untuk ON/OFF
function setupControls() {
    const buzCard = document.getElementById('buzzerStatus').closest('.metric-card');
    const ledCard = document.getElementById('ledStatus').closest('.metric-card');

    buzCard.onclick = async () => {
        const current = document.getElementById('buzzerStatus').textContent === 'ON' ? 0 : 1;
        await fetch(`${_URL}/update?token=${_AUTH}&V2=${current}`);
        fetchBlynkData();
    };

    ledCard.onclick = async () => {
        const current = document.getElementById('ledStatus').textContent === 'ON' ? 0 : 1;
        await fetch(`${_URL}/update?token=${_AUTH}&V3=${current}`);
        fetchBlynkData();
    };
}

function updateStatus(online, msg) {
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    if (badge) badge.className = online ? 'connection-status connected' : 'connection-status';
    if (text) text.textContent = msg;
}
