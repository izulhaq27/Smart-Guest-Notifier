/**
 * SMART GUEST NOTIFIER - REPAIR SCRIPT V4.0
 * Fix: Data binding for V1, V2, V3 and Control Interaction
 */

var _AUTH = "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
var _URL  = "https://blynk.cloud/external/api";

let lastVisitorCount = -1;
let lastExitCount = -1;

let trendChartInstance = null;
let donutChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Dashboard Ready. Starting sync...");
    setupInteractiveControls();
    initCharts();
    
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
        const currentVisitorCount = parseInt(v0) || 0;
        document.getElementById('todayVisitorCount').textContent = currentVisitorCount;

        // --- 2. Exit Count (V1) ---
        const v1 = extractPinValue(data, 'V1', 0);
        const currentExitCount = parseInt(v1) || 0;
        const exitEl = document.getElementById('exitCount');
        if (exitEl) {
            exitEl.textContent = currentExitCount;
        }

        // Notification & Table Logic
        const currentHour = new Date().getHours();
        
        if (lastVisitorCount === -1) {
            // Initial load
            if (currentVisitorCount > 0 || currentExitCount > 0) {
                updateCharts(currentVisitorCount);
                addActivityLog("Sistem Terhubung", `Total masuk: ${currentVisitorCount}, keluar: ${currentExitCount}`, "purple", "ph-fill ph-power");
                addHistoryTableRow("-", "normal", "Sistem Aktif");
            }
        } else {
            if (currentVisitorCount > lastVisitorCount) {
                if (currentHour >= 7 && currentHour < 9) {
                    showNotification("Karyawan Masuk Kerja!", "var(--color-purple)");
                    addActivityLog("Karyawan Masuk", "Karyawan masuk ke area", "purple", "ph-fill ph-user-check");
                    addHistoryTableRow("-", "normal", "Karyawan Masuk");
                } else {
                    showNotification("Tamu Umum Masuk!", "var(--color-blue)");
                    addActivityLog("Tamu Masuk", "Tamu umum terdeteksi", "blue", "ph-fill ph-user");
                    addHistoryTableRow("-", "normal", "Tamu Masuk");
                }
                updateCharts(currentVisitorCount);
            }
            
            if (currentExitCount > lastExitCount) {
                showNotification("Karyawan Pulang!", "var(--color-red)");
                addActivityLog("Karyawan Pulang", "Karyawan meninggalkan area", "red", "ph-fill ph-sign-out");
                addHistoryTableRow("-", "alert", "Pulang");
            }
        }

        lastVisitorCount = currentVisitorCount;
        lastExitCount = currentExitCount;

        // --- 3. Status Buzzer (V2) ---
        const v2 = extractPinValue(data, 'V2', 0);
        const buzEl = document.getElementById('buzzerStatus');
        if (buzEl) buzEl.textContent = parseInt(v2) ? 'ON' : 'OFF';

        // --- 4. Status LED (V3) ---
        const v3 = extractPinValue(data, 'V3', 0);
        const ledEl = document.getElementById('ledStatus');
        if (ledEl) ledEl.textContent = parseInt(v3) ? 'ON' : 'OFF';

        updateConnectionUI(true, "Connected to Blynk");

        // Update timestamps
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const lastSyncEl = document.getElementById('lastSyncTime');
        if (lastSyncEl) lastSyncEl.textContent = timeStr;
        const lastDetEl = document.getElementById('lastDetectionTime');
        if (lastDetEl && (currentVisitorCount > 0 || currentExitCount > 0)) lastDetEl.textContent = timeStr;

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
            const current = buzzerStatus.textContent.trim() === 'ON' ? 0 : 1;
            buzzerStatus.textContent = current ? 'ON' : 'OFF';
            console.log("Sending Buzzer Update:", current);
            try {
                await fetch(`${_URL}/update?token=${_AUTH}&V2=${current}`);
            } catch(e) { console.error(e); }
            setTimeout(fetchBlynkData, 1000);
        };
    }

    if (ledStatus) {
        const ledCard = ledStatus.closest('.metric-card');
        ledCard.style.cursor = "pointer";
        ledCard.onclick = async () => {
            const current = ledStatus.textContent.trim() === 'ON' ? 0 : 1;
            ledStatus.textContent = current ? 'ON' : 'OFF';
            console.log("Sending LED Update:", current);
            try {
                await fetch(`${_URL}/update?token=${_AUTH}&V3=${current}`);
            } catch(e) { console.error(e); }
            setTimeout(fetchBlynkData, 1000);
        };
    }

    // --- Search Feature ---
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const rows = document.querySelectorAll('#historyTableBody tr');
            
            rows.forEach(row => {
                if(row.querySelector('td[colspan]')) return; 
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }

    // --- Refresh Data Feature ---
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Memuat...';
            refreshBtn.style.opacity = '0.7';
            refreshBtn.style.cursor = 'wait';
            
            fetchBlynkData().then(() => {
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.style.opacity = '1';
                    refreshBtn.style.cursor = 'pointer';
                    showNotification("Data berhasil diperbarui!", "var(--color-blue)");
                }, 500);
            }).catch(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.style.opacity = '1';
                refreshBtn.style.cursor = 'pointer';
            });
        });
    }

    // --- Delete / Reset Feature ---
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if(confirm("Apakah Anda yakin ingin menghapus semua riwayat dan mereset alat ke 0?")) {
                const tbody = document.getElementById('historyTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray">Belum ada data history pengunjung</td></tr>';
                
                const actLog = document.getElementById('activityLog');
                if (actLog) actLog.innerHTML = '<div class="activity-empty">Belum ada aktivitas</div>';
                
                // Reset Blynk V0 and V1
                try {
                    await fetch(`${_URL}/update?token=${_AUTH}&V0=0&V1=0`);
                    lastVisitorCount = -1;
                    lastExitCount = -1;
                    setTimeout(fetchBlynkData, 500);
                    showNotification("Sistem berhasil direset", "var(--color-purple)");
                } catch(e) {
                    console.error("Gagal mereset Blynk", e);
                }
            }
        });
    }

    // --- Download CSV Feature ---
    const exportCSV = () => {
        const rows = document.querySelectorAll('#historyTableBody tr');
        let csvContent = "data:text/csv;charset=utf-8,NO,WAKTU,JARAK,AKUMULASI,STATUS\n";
        
        let hasData = false;
        rows.forEach(row => {
            if(row.querySelector('td[colspan]')) return; 
            hasData = true;
            const cols = row.querySelectorAll('td');
            const rowData = Array.from(cols).map(c => c.textContent.trim()).join(",");
            csvContent += rowData + "\n";
        });
        
        if(!hasData) {
            alert("Tidak ada data untuk didownload!");
            return;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Data_Pengunjung_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', exportCSV);
}

function updateConnectionUI(online, msg) {
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    const sysText = document.getElementById('systemStatusText');
    if (badge) badge.className = online ? 'connection-status connected' : 'connection-status';
    if (text) text.textContent = msg;
    if (sysText) sysText.textContent = online ? 'Online' : 'Offline';
}

function showNotification(message, colorCode) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.borderLeftColor = colorCode;
    notif.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(notif);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(100%)';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function initCharts() {
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        trendChartInstance = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [], 
                datasets: [{
                    label: 'Pengunjung',
                    data: [],
                    borderColor: '#8c73e6',
                    backgroundColor: 'rgba(140, 115, 230, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    const donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
        donutChartInstance = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pagi', 'Siang', 'Malam'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#8c73e6', '#f6c042', '#fa7076'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function updateCharts(visitorCount) {
    if (!trendChartInstance || !donutChartInstance) return;
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Update Line Chart
    trendChartInstance.data.labels.push(timeStr);
    trendChartInstance.data.datasets[0].data.push(visitorCount);
    
    if (trendChartInstance.data.labels.length > 10) {
        trendChartInstance.data.labels.shift();
        trendChartInstance.data.datasets[0].data.shift();
    }
    trendChartInstance.update();

    // Update Donut Chart
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
        donutChartInstance.data.datasets[0].data[0]++; // Pagi
    } else if (currentHour >= 12 && currentHour < 18) {
        donutChartInstance.data.datasets[0].data[1]++; // Siang
    } else {
        donutChartInstance.data.datasets[0].data[2]++; // Malam
    }
    donutChartInstance.update();

    // Update Stats text
    const total = donutChartInstance.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const trafficEl = document.getElementById('trafficIntensity');
    if (trafficEl) trafficEl.textContent = (total > 0 ? 'Aktif' : '0%');
    
    const peakCountEl = document.getElementById('peakCount');
    if (peakCountEl) peakCountEl.textContent = visitorCount;
    
    const avgEl = document.getElementById('avgPerHour');
    if (avgEl) avgEl.textContent = Math.ceil(visitorCount / (trendChartInstance.data.labels.length || 1));
}

function addActivityLog(title, desc, colorClass, iconClass) {
    const logContainer = document.getElementById('activityLog');
    if (!logContainer) return;

    const emptyMsg = logContainer.querySelector('.activity-empty');
    if (emptyMsg) emptyMsg.remove();
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const html = `
    <div class="activity-item">
        <div class="act-time">${timeStr}</div>
        <div class="act-icon ${colorClass}"><i class="${iconClass}"></i></div>
        <div class="act-content">
            <h4>${title}</h4>
            <p>${desc}</p>
        </div>
    </div>
    `;
    logContainer.insertAdjacentHTML('afterbegin', html);
}

function addHistoryTableRow(distanceVal, statusBadge, statusText) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    if(tbody.querySelector('.text-center')) {
        tbody.innerHTML = '';
    }
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const no = tbody.children.length + 1;
    const currentTotal = document.getElementById('todayVisitorCount').textContent;
    
    const html = `
    <tr>
        <td>${no}</td>
        <td>${timeStr}</td>
        <td>${distanceVal}</td>
        <td>${currentTotal}</td>
        <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
    </tr>
    `;
    tbody.insertAdjacentHTML('afterbegin', html);
}
