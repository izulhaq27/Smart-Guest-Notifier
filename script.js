/* ===================================
   SMART GUEST NOTIFIER - MAIN SCRIPT
   Blynk Cloud Integration via HTTP API
   =================================== */

// ===================================
// ⚙️ KONFIGURASI BLYNK
// ===================================
const BLYNK_AUTH_TOKEN = "vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0";
const BLYNK_BASE_URL   = "https://blynk.cloud/external/api";

// Virtual Pins — sesuaikan dengan Blynk Datastream kamu
const VPIN_VISITOR_COUNT = "V0"; // Integer — Total Pengunjung
const VPIN_DISTANCE      = "V1"; // Double  — Jarak Sensor (cm)
const VPIN_BUZZER        = "V2"; // Integer — 1=ON, 0=OFF
const VPIN_LED           = "V3"; // Integer — 1=ON, 0=OFF

// Interval polling (ms) — Blynk free plan: maks ~1 req/detik
// 5000ms = aman untuk 1 request per siklus
const POLL_INTERVAL_MS = 5000;

// ===================================
// GLOBAL STATE
// ===================================
let appState = {
    todayVisitors: 0,
    lastDetectionTime: null,
    lastDistance: 0,
    deviceOnline: false,
    visitorHistory: JSON.parse(localStorage.getItem('visitorHistory')) || [],
    hourlyData: new Array(12).fill(0),
    trendChart: null,
    donutChart: null,
    historyPage: 1,
    historyItemsPerPage: 5,
    searchQuery: '',
    prevVisitorCount: -1, // Untuk mendeteksi kenaikan
    pollIntervalId: null,
};

// ===================================
// DOM ELEMENTS
// ===================================
const todayVisitorCountEl  = document.getElementById('todayVisitorCount');
const sensorDistanceEl     = document.getElementById('sensorDistance');
const buzzerStatusEl       = document.getElementById('buzzerStatus');
const ledStatusEl          = document.getElementById('ledStatus');
const systemStatusTextEl   = document.getElementById('systemStatusText');
const peakHourEl           = document.getElementById('peakHour');
const lastDetectionTimeEl  = document.getElementById('lastDetectionTime');
const avgPerHourEl         = document.getElementById('avgPerHour');
const peakCountEl          = document.getElementById('peakCount');
const trafficIntensityEl   = document.getElementById('trafficIntensity');
const lastSyncTimeEl       = document.getElementById('lastSyncTime');
const activityLogEl        = document.getElementById('activityLog');
const historyTableBodyEl   = document.getElementById('historyTableBody');
const refreshBtnEl         = document.getElementById('refreshBtn');
const resetBtnEl           = document.getElementById('resetBtn');
const exportBtnEl          = document.getElementById('exportBtn');
const downloadBtnEl        = document.getElementById('downloadBtn');
const searchInputEl        = document.getElementById('searchInput');

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    initializeCharts();
    setupEventListeners();
    updateAllDisplay();
    setInterval(updateTimestamp, 1000);

    // Mulai polling data dari Blynk
    startBlynkPolling();

    showNotification('Dashboard siap — menghubungkan ke Blynk...', 'info');
});

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    refreshBtnEl.addEventListener('click', () => {
        fetchAllBlynkData();
        showNotification('Refresh manual...', 'info');
    });

    resetBtnEl.addEventListener('click', resetCounter);
    exportBtnEl.addEventListener('click', exportData);
    if (downloadBtnEl) downloadBtnEl.addEventListener('click', exportData);

    if (searchInputEl) {
        searchInputEl.addEventListener('input', (e) => {
            appState.searchQuery = e.target.value.toLowerCase();
            appState.historyPage = 1;
            renderHistoryTable();
        });
    }

    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===================================
// 🔗 BLYNK API — POLLING
// ===================================

/**
 * Ambil SEMUA pin sekaligus dengan 1 request (lebih efisien, anti rate-limit)
 * Endpoint: GET /external/api/getAll?token=TOKEN
 * Response: { "V0": "5", "V1": "23.5", "V2": "0", "V3": "0" }
 */
async function fetchAllBlynkData() {
    try {
        const url      = `${BLYNK_BASE_URL}/getAll?token=${BLYNK_AUTH_TOKEN}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        
        // Cek apakah response valid dan memiliki setidaknya data v0 (Visitor Count)
        if (!json || typeof json[VPIN_VISITOR_COUNT.toLowerCase()] === 'undefined') {
            throw new Error("Respons Blynk kosong atau VPin belum terinisialisasi");
        }

        // Blynk getAll mengembalikan object dengan key lowercase (v0, v1, dst)
        const newCount  = parseInt(json[VPIN_VISITOR_COUNT.toLowerCase()])  || 0;
        const newDist   = parseFloat(json[VPIN_DISTANCE.toLowerCase()])     || 0;
        const newBuzzer = parseInt(json[VPIN_BUZZER.toLowerCase()])         || 0;
        const newLed    = parseInt(json[VPIN_LED.toLowerCase()])            || 0;

        // --- Update status online ---
        if (!appState.deviceOnline) {
            updateBlynkStatus(true);
            showNotification('✓ Terhubung ke Blynk Cloud', 'success');
        }

        // --- Deteksi pengunjung baru ---
        if (appState.prevVisitorCount === -1) {
            appState.prevVisitorCount = newCount;
        } else if (newCount < appState.prevVisitorCount) {
            // Jika nilai dari Blynk tiba-tiba lebih kecil, berarti ESP32 baru saja di-restart
            appState.prevVisitorCount = newCount;
        } else if (newCount > appState.prevVisitorCount) {
            // Ada kenaikan riil pengunjung → log ke tabel & diagram
            const diff = newCount - appState.prevVisitorCount;
            // Gunakan jarak yang wajar jika kebetulan polling membaca 0 saat orang lewat
            const detectedDist = newDist > 0 ? newDist : 25.0; 
            
            for (let i = 0; i < diff; i++) {
                logNewVisitor(detectedDist);
            }
            appState.prevVisitorCount = newCount;
            
            // KARENA polling web 5 detik sekali, ada kemungkinan status V2 dan V3 di Blynk 
            // sudah keburu OFF sebelum sempat terbaca.
            // Jadi, setiap kali ada penambahan tamu, kita PAKSA nyalakan UI Buzzer & LED 
            // di dashboard selama beberapa detik agar terlihat responsif!
            newBuzzer = 1;
            newLed = 1;
            
            // Update UI jarak juga agar tidak tertulis "-- cm" saat notifikasi muncul
            if (newDist === 0) {
                newDist = detectedDist; 
            }
        }

        appState.todayVisitors    = newCount;
        appState.lastDistance     = newDist;

        // --- Update UI langsung ---
        todayVisitorCountEl.textContent = newCount + '+';
        sensorDistanceEl.textContent    = newDist > 0 ? newDist.toFixed(1) + ' cm' : '-- cm';
        buzzerStatusEl.textContent      = newBuzzer ? 'ON' : 'OFF';
        ledStatusEl.textContent         = newLed ? 'ON' : 'OFF';

        // Animasi flash jika buzzer atau LED ON
        if (newBuzzer || newLed) {
            const bCard = buzzerStatusEl.closest('.metric-card');
            const lCard = ledStatusEl.closest('.metric-card');
            if (bCard) bCard.classList.add('flash');
            if (lCard) lCard.classList.add('flash');
            
            // Hapus class flash setelah 2 detik
            setTimeout(() => {
                if (bCard) bCard.classList.remove('flash');
                if (lCard) lCard.classList.remove('flash');
                
                // Jika tidak ada data baru dari polling, kembalikan teks ke OFF
                buzzerStatusEl.textContent = 'OFF';
                ledStatusEl.textContent = 'OFF';
            }, 2000);
        }

        updateAllDisplay();
        saveToPersistence();

        // Update timestamp sync
        const now = new Date();
        lastSyncTimeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    } catch (err) {
        console.warn('Gagal fetch Blynk:', err.message);
        // Jika gagal, coba lakukan fallback untuk mengambil pin V0 saja
        try {
            const fallbackUrl = `${BLYNK_BASE_URL}/get?token=${BLYNK_AUTH_TOKEN}&${VPIN_VISITOR_COUNT}`;
            const fbRes = await fetch(fallbackUrl);
            if (fbRes.ok) {
                const val = await fbRes.json();
                const newCount = parseInt(val) || 0;
                if (!appState.deviceOnline) updateBlynkStatus(true);
                
                if (appState.prevVisitorCount === -1) {
                    appState.prevVisitorCount = newCount;
                } else if (newCount > appState.prevVisitorCount) {
                    logNewVisitor(15.0);
                    appState.prevVisitorCount = newCount;
                }
                appState.todayVisitors = newCount;
                todayVisitorCountEl.textContent = newCount + '+';
                updateAllDisplay();
                return;
            }
        } catch(fallbackErr) {
            console.error("Fallback juga gagal:", fallbackErr.message);
        }
        
        updateBlynkStatus(false);
    }
}

/**
 * Mulai polling otomatis setiap POLL_INTERVAL_MS
 */
function startBlynkPolling() {
    // Langsung fetch pertama kali
    fetchAllBlynkData();
    // Kemudian polling
    appState.pollIntervalId = setInterval(fetchAllBlynkData, POLL_INTERVAL_MS);
}

// ===================================
// STATUS KONEKSI
// ===================================
function updateBlynkStatus(isConnected) {
    appState.deviceOnline = isConnected;
    const badge = document.getElementById('blynkConnection');
    const text  = document.getElementById('blynkStatusText');
    const sysEl = document.getElementById('systemStatusText');

    if (badge && text) {
        if (isConnected) {
            badge.classList.add('connected');
            text.textContent = 'Connected to Blynk';
        } else {
            badge.classList.remove('connected');
            text.textContent = 'Offline — Reconnecting...';
        }
    }
    if (sysEl) sysEl.textContent = isConnected ? 'Online' : 'Offline';
}

// ===================================
// DATA HANDLING
// ===================================
function loadInitialData() {
    const savedData = localStorage.getItem('dashboardData');
    if (savedData) {
        const data = JSON.parse(savedData);
        appState.todayVisitors    = data.todayVisitors    || 0;
        appState.lastDetectionTime = data.lastDetectionTime;
        appState.hourlyData       = data.hourlyData       || new Array(12).fill(0);
        appState.prevVisitorCount = data.todayVisitors    || -1;
    }
}

function saveToPersistence() {
    localStorage.setItem('dashboardData', JSON.stringify({
        todayVisitors: appState.todayVisitors,
        lastDetectionTime: appState.lastDetectionTime,
        hourlyData: appState.hourlyData,
    }));
    localStorage.setItem('visitorHistory', JSON.stringify(appState.visitorHistory));
}

// ===================================
// VISITOR LOGGING
// ===================================
function logNewVisitor(distance = 25) {
    const now  = new Date();
    const time = now.toLocaleTimeString('id-ID');

    appState.lastDetectionTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const hour = Math.floor(now.getHours() / 2);
    appState.hourlyData[hour]++;

    appState.visitorHistory.unshift({
        no: appState.visitorHistory.length + 1,
        time: time,
        status: 'Terdeteksi',
        distance: distance.toFixed(1),
        total: appState.todayVisitors,
    });

    if (appState.visitorHistory.length > 100) appState.visitorHistory.pop();

    showNotification(`🔔 Pengunjung baru terdeteksi! Jarak: ${distance.toFixed(1)} cm`, 'success');
}

function resetCounter() {
    if (confirm('Hapus semua data history di dashboard?\n(Data di ESP32 / Blynk tidak berubah)')) {
        appState.todayVisitors     = 0;
        appState.prevVisitorCount  = -1;
        appState.visitorHistory    = [];
        appState.hourlyData        = new Array(12).fill(0);
        appState.lastDetectionTime = null;
        sensorDistanceEl.textContent = '-- cm';
        saveToPersistence();
        updateAllDisplay();
        showNotification('Data lokal dihapus', 'info');
    }
}

// ===================================
// DISPLAY UPDATES
// ===================================
function updateAllDisplay() {
    todayVisitorCountEl.textContent = appState.todayVisitors + '+';

    if (appState.lastDetectionTime) {
        lastDetectionTimeEl.textContent = appState.lastDetectionTime;
    }

    const data    = appState.hourlyData;
    const total   = data.reduce((a, b) => a + b, 0);
    const avg     = (total / data.length).toFixed(1);
    avgPerHourEl.textContent = avg;

    const peakCount = Math.max(...data);
    peakCountEl.textContent = peakCount;

    const maxIndex = data.indexOf(peakCount);
    peakHourEl.textContent = `${(maxIndex * 2).toString().padStart(2, '0')}:00`;

    const intensity = Math.min((appState.todayVisitors / 100) * 100, 100).toFixed(0);
    trafficIntensityEl.textContent = intensity + '%';

    updateChartData();
    renderActivityLog();
    renderHistoryTable();
}

function updateTimestamp() {
    const now = new Date();
    // Hanya update jika Blynk tidak pernah berhasil (agar tidak override sync time)
    if (!appState.deviceOnline) {
        lastSyncTimeEl.textContent = now.toLocaleDateString('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).replace(/\//g, '-');
    }
}

// ===================================
// CHARTS
// ===================================
function initializeCharts() {
    if (typeof Chart === 'undefined') {
        console.warn("⚠️ Warning: Chart.js library tidak termuat. Grafik visualisasi dinonaktifkan.");
        return;
    }
    createTrendChart();
    createDonutChart();
}

function generateHourLabels() {
    const labels = [];
    for (let i = 0; i < 12; i++) {
        labels.push(`${(i * 2).toString().padStart(2, '0')}:00`);
    }
    return labels;
}

function createTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(140, 115, 230, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    appState.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateHourLabels(),
            datasets: [{
                label: 'Pengunjung',
                data: appState.hourlyData,
                borderColor: '#8c73e6',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#8c73e6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0', borderDash: [5, 5] },
                    ticks: { color: '#a3aed1', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a3aed1', font: { size: 10 }, maxTicksLimit: 6 }
                }
            }
        }
    });
}

function createDonutChart() {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;

    appState.donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pagi', 'Siang', 'Malam'],
            datasets: [{
                data: [1, 1, 1],
                backgroundColor: ['#8c73e6', '#f6c042', '#fa7076'],
                borderWidth: 0,
                cutout: '75%',
                borderRadius: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function updateChartData() {
    if (appState.trendChart) {
        appState.trendChart.data.datasets[0].data = appState.hourlyData;
        appState.trendChart.update();
    }

    if (appState.donutChart) {
        const d     = appState.hourlyData;
        const pagi  = d.slice(0, 4).reduce((a, b) => a + b, 0);
        const siang = d.slice(4, 9).reduce((a, b) => a + b, 0);
        const malam = d.slice(9, 12).reduce((a, b) => a + b, 0);

        appState.donutChart.data.datasets[0].data =
            (pagi === 0 && siang === 0 && malam === 0) ? [1, 1, 1] : [pagi, siang, malam];
        appState.donutChart.update();
    }
}

// ===================================
// ACTIVITIES & TABLE
// ===================================
function renderActivityLog() {
    if (appState.visitorHistory.length === 0) {
        activityLogEl.innerHTML = '<div class="activity-item"><p class="text-gray">Belum ada aktivitas</p></div>';
        return;
    }

    const colors = ['purple', 'blue', 'red'];
    const icons  = ['ph-bell-ringing', 'ph-activity', 'ph-warning-circle'];

    let html = '';
    const displayCount = Math.min(appState.visitorHistory.length, 5);
    for (let i = 0; i < displayCount; i++) {
        const item  = appState.visitorHistory[i];
        const color = colors[i % colors.length];
        const icon  = icons[i % icons.length];

        html += `
        <div class="activity-item">
            <div class="act-time">${item.time.slice(0, 5)}</div>
            <div class="act-icon ${color}"><i class="ph-fill ${icon}"></i></div>
            <div class="act-content">
                <h4>Deteksi Objek #${item.total}</h4>
                <p>Sensor jarak: ${item.distance} cm</p>
            </div>
        </div>`;
    }
    activityLogEl.innerHTML = html;
}

function renderHistoryTable() {
    const paginationControls = document.getElementById('paginationControls');
    const showingText        = document.getElementById('showingText');

    const filteredHistory = appState.visitorHistory.filter(item => {
        if (!appState.searchQuery) return true;
        return item.time.toLowerCase().includes(appState.searchQuery)
            || item.distance.toString().includes(appState.searchQuery)
            || item.status.toLowerCase().includes(appState.searchQuery);
    });

    if (filteredHistory.length === 0) {
        historyTableBodyEl.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray">Belum ada data history pengunjung</td></tr>';
        if (paginationControls) paginationControls.innerHTML = '';
        if (showingText) showingText.textContent = appState.searchQuery ? 'Data tidak ditemukan' : 'Menampilkan data history terbaru';
        return;
    }

    const totalItems = filteredHistory.length;
    const totalPages = Math.ceil(totalItems / appState.historyItemsPerPage);

    if (appState.historyPage > totalPages) appState.historyPage = totalPages;
    if (appState.historyPage < 1) appState.historyPage = 1;

    const startIndex   = (appState.historyPage - 1) * appState.historyItemsPerPage;
    const endIndex     = Math.min(startIndex + appState.historyItemsPerPage, totalItems);
    const currentItems = filteredHistory.slice(startIndex, endIndex);

    let html = '';
    currentItems.forEach((item) => {
        html += `
        <tr>
            <td>${item.no}</td>
            <td>${item.time}</td>
            <td>${item.distance} cm</td>
            <td>${item.total}</td>
            <td><span class="status-badge alert">Terdeteksi</span></td>
        </tr>`;
    });
    historyTableBodyEl.innerHTML = html;

    if (showingText) {
        showingText.textContent = `Menampilkan ${startIndex + 1}–${endIndex} dari ${totalItems} data`;
    }

    if (paginationControls) {
        let pagHtml = `<i class="ph ph-caret-left" onclick="changePage(-1)" style="cursor:pointer"></i>`;
        for (let i = 1; i <= totalPages; i++) {
            pagHtml += `<span class="page-num ${i === appState.historyPage ? 'active' : ''}" onclick="goToPage(${i})" style="cursor:pointer">${i}</span>`;
        }
        pagHtml += `<i class="ph ph-caret-right" onclick="changePage(1)" style="cursor:pointer"></i>`;
        paginationControls.innerHTML = pagHtml;
    }
}

function changePage(direction) {
    const filteredHistory = appState.visitorHistory.filter(item => {
        if (!appState.searchQuery) return true;
        return item.time.toLowerCase().includes(appState.searchQuery)
            || item.distance.toString().includes(appState.searchQuery)
            || item.status.toLowerCase().includes(appState.searchQuery);
    });
    const totalPages = Math.ceil(filteredHistory.length / appState.historyItemsPerPage);
    const newPage    = appState.historyPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        appState.historyPage = newPage;
        renderHistoryTable();
    }
}

function goToPage(page) {
    appState.historyPage = page;
    renderHistoryTable();
}

// ===================================
// UTILS
// ===================================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notif     = document.createElement('div');
    notif.className = 'notification';
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    notif.innerHTML = `<span>${emoji}</span> <span>${message}</span>`;
    container.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(100%)';
        notif.style.transition = 'all 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

function handleKeyboardShortcuts(e) {
    // Tekan R untuk refresh manual
    if ((e.key === 'R' || e.key === 'r') && !e.ctrlKey) {
        fetchAllBlynkData();
    }
}

function exportData() {
    let csv = 'No,Waktu,Jarak (cm),Total,Status\n';
    appState.visitorHistory.forEach(item => {
        csv += `${item.no},${item.time},${item.distance},${item.total},${item.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `smart-guest-notifier-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showNotification('Data berhasil diexport!', 'success');
}
