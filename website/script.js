/* ===================================
   SMART GUEST NOTIFIER - MAIN SCRIPT
   Business Insights Analytics
   =================================== */

// ===================================
// CONFIGURATION
// ===================================

const BLYNK_CONFIG = {
    AUTH_TOKEN: 'vSf5e3xetchrYJJ6C2n-rSlePpLMFfh0',
    TEMPLATE_ID: 'TMPL6gaw4vA0v',
    DEVICE_ID: 'YOUR_DEVICE_ID',
    API_BASE_URL: 'https://blynk.cloud/external/api',
    VIRTUAL_PIN_VISITOR: 'V0',
    REFRESH_INTERVAL: 3000,
};

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
};

// ===================================
// DOM ELEMENTS
// ===================================

const todayVisitorCountEl = document.getElementById('todayVisitorCount');
const systemStatusEl = document.getElementById('systemStatus');
const systemStatusTextEl = document.getElementById('systemStatusText');
const lastDetectionTimeEl = document.getElementById('lastDetectionTime');
const lastDetectionDescriptionEl = document.getElementById('lastDetectionDescription');
const sensorDistanceEl = document.getElementById('sensorDistance');
const statusLabelEl = document.getElementById('statusLabel');
const footerStatusEl = document.getElementById('footerStatus');
const lastUpdateTimeEl = document.getElementById('lastUpdateTime');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Analytics Elements
const avgPerHourEl = document.getElementById('avgPerHour');
const peakHourEl = document.getElementById('peakHour');
const todayTotalEl = document.getElementById('todayTotal');
const peakCountEl = document.getElementById('peakCount');
const quietCountEl = document.getElementById('quietCount');
const trafficIntensityEl = document.getElementById('trafficIntensity');
const recommendationTextEl = document.getElementById('recommendationText');

// History Elements
const historyTableBodyEl = document.getElementById('historyTableBody');
const hourFilterEl = document.getElementById('hourFilter');
const exportBtnEl = document.getElementById('exportBtn');

// Button Elements
const refreshBtnEl = document.getElementById('refreshBtn');
const resetBtnEl = document.getElementById('resetBtn');

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Smart Guest Notifier Dashboard Initialized');
    
    // Load initial data from localStorage
    loadInitialData();
    
    // Initialize Chart
    initializeChart();
    
    // Event Listeners
    setupEventListeners();
    
    // Initial Update
    updateAllDisplay();
    
    // Auto Refresh
    setInterval(refreshData, BLYNK_CONFIG.REFRESH_INTERVAL);
    setInterval(updateTimestamp, 1000);
    
    // Show welcome notification
    showNotification('🎉 Dashboard Ready! Sistem siap untuk monitoring pengunjung.', 'success');
});

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    // Buttons
    refreshBtnEl.addEventListener('click', refreshData);
    resetBtnEl.addEventListener('click', resetCounter);
    exportBtnEl.addEventListener('click', exportData);
    
    // History Filter
    hourFilterEl.addEventListener('change', filterHistory);
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===================================
// TAB NAVIGATION
// ===================================

function switchTab(e) {
    const targetTab = e.currentTarget.dataset.tab;
    
    // Remove active dari semua tab
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active ke tab yang diklik
    e.currentTarget.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
    
    // Update chart jika tab analytics dibuka
    if (targetTab === 'analytics' && appState.trendChart) {
        setTimeout(() => appState.trendChart.resize(), 100);
    }
}

// ===================================
// DATA LOADING & PERSISTENCE
// ===================================

function loadInitialData() {
    const savedData = localStorage.getItem('dashboardData');
    if (savedData) {
        const data = JSON.parse(savedData);
        appState.todayVisitors = data.todayVisitors || 0;
        appState.lastDetectionTime = data.lastDetectionTime;
        appState.hourlyData = data.hourlyData || new Array(12).fill(0);
    }
    
    // Load visitor history
    appState.visitorHistory = JSON.parse(localStorage.getItem('visitorHistory')) || [];
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
// DATA REFRESH
// ===================================

async function refreshData() {
    try {
        // Simulate Blynk API fetch
        // In production, replace dengan actual Blynk API call
        
        // Update dari localStorage untuk demo
        updateAllDisplay();
        updateSystemStatus();
        
    } catch (error) {
        console.error('❌ Error refreshing data:', error);
        updateSystemStatus(false);
    }
}

// ===================================
// DISPLAY UPDATES
// ===================================

function updateAllDisplay() {
    updateVisitorCount();
    updateLastDetection();
    updateChartData();
    updateBusinessInsights();
    renderHistoryTable();
    updateTimestamp();
}

function updateVisitorCount() {
    todayVisitorCountEl.textContent = appState.todayVisitors;
    todayTotalEl.textContent = appState.todayVisitors;
    
    // Update circle progress
    const maxVisitors = 100;
    const percentage = Math.min((appState.todayVisitors / maxVisitors) * 283, 283);
    const circleProgress = document.querySelector('.circle-progress');
    if (circleProgress) {
        circleProgress.style.strokeDashoffset = 283 - percentage;
    }
}

function updateLastDetection() {
    if (appState.lastDetectionTime) {
        lastDetectionTimeEl.textContent = appState.lastDetectionTime;
        const now = new Date();
        const lastTime = new Date(appState.lastDetectionTime);
        const diffMinutes = Math.floor((now - lastTime) / 60000);
        
        let description = '';
        if (diffMinutes === 0) {
            description = 'Baru saja';
        } else if (diffMinutes < 60) {
            description = `${diffMinutes} menit yang lalu`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            description = `${hours} jam yang lalu`;
        }
        lastDetectionDescriptionEl.textContent = description;
    } else {
        lastDetectionTimeEl.textContent = '--:--:--';
        lastDetectionDescriptionEl.textContent = 'Belum ada pengunjung';
    }
}

function updateSystemStatus(online = true) {
    appState.deviceOnline = online;
    
    if (online) {
        systemStatusEl.classList.remove('offline');
        systemStatusEl.classList.add('active');
        systemStatusTextEl.textContent = '🟢 Terhubung';
        statusLabelEl.textContent = '🟢 Terhubung';
        footerStatusEl.textContent = 'Online';
        statusLabelEl.style.color = 'var(--success-color)';
    } else {
        systemStatusEl.classList.add('offline');
        systemStatusTextEl.textContent = '🔴 Offline';
        statusLabelEl.textContent = '🔴 Offline';
        footerStatusEl.textContent = 'Offline';
        statusLabelEl.style.color = 'var(--error-color)';
    }
}

function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdateTimeEl.textContent = timeString;
}

// ===================================
// BUSINESS INSIGHTS
// ===================================

function updateBusinessInsights() {
    const data = appState.hourlyData;
    
    // Rata-rata per jam
    const avg = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    avgPerHourEl.textContent = avg;
    
    // Waktu puncak (peak time)
    const maxIndex = data.indexOf(Math.max(...data));
    const peakHour = `${(maxIndex * 2).toString().padStart(2, '0')}:00 - ${((maxIndex * 2) + 2).toString().padStart(2, '0')}:00`;
    peakHourEl.textContent = peakHour;
    
    // Peak dan Quiet count
    const peakCount = Math.max(...data);
    const quietCount = Math.min(...data.filter(x => x > 0)) || 0;
    
    peakCountEl.textContent = peakCount;
    quietCountEl.textContent = quietCount;
    
    // Traffic Intensity
    const maxPossible = 100; // Asumsi max 100 pengunjung per jam
    const intensity = Math.min((appState.todayVisitors / (maxPossible * 12)) * 100, 100).toFixed(0);
    trafficIntensityEl.textContent = intensity + '%';
    
    // Generate Recommendation
    generateRecommendation(peakCount, quietCount, avg, appState.todayVisitors);
    
    // Update chart
    if (appState.trendChart) {
        appState.trendChart.data.datasets[0].data = data;
        appState.trendChart.update('none');
    }
}

function generateRecommendation(peakCount, quietCount, avg, total) {
    let recommendation = '';
    
    if (total === 0) {
        recommendation = '📊 Belum ada pengunjung hari ini. Tunggu pelanggan tiba...';
    } else if (total < 20) {
        recommendation = `📉 Traffic rendah hari ini (${total} pengunjung). Ini adalah waktu yang tepat untuk stock audit atau maintenance.`;
    } else if (total < 50) {
        recommendation = `📊 Traffic normal hari ini (${total} pengunjung). Staf saat ini sudah cukup untuk melayani pelanggan.`;
    } else if (total < 100) {
        recommendation = `📈 Traffic tinggi! (${total} pengunjung). Pertimbangkan untuk menambah staf pada jam ${Math.floor(Math.random() * 12) * 2}:00 - ${(Math.floor(Math.random() * 12) * 2) + 2}:00.`;
    } else {
        recommendation = `🔥 Traffic SANGAT tinggi! (${total} pengunjung). Perlu tindakan cepat: tambah staf, buka checkout tambahan, atau implementasi antrian.`;
    }
    
    if (peakCount > avg * 1.5) {
        recommendation += ` \n⚠️ Peak hour terdeteksi pada jam ${Math.floor(Math.random() * 12) * 2}:00.`;
    }
    
    recommendationTextEl.textContent = recommendation;
}

// ===================================
// CHART MANAGEMENT
// ===================================

function initializeChart() {
    // Load Chart.js dari CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@latest/dist/chart.min.js';
    script.onload = () => {
        createTrendChart();
    };
    document.head.appendChild(script);
}

function createTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    appState.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateHourLabels(),
            datasets: [{
                label: 'Pengunjung per Jam',
                data: appState.hourlyData,
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FF6B35',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#B0B0B0',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#808080' },
                    grid: { color: 'rgba(51, 51, 51, 0.5)' }
                },
                x: {
                    ticks: { color: '#808080' },
                    grid: { color: 'rgba(51, 51, 51, 0.3)' }
                }
            }
        }
    });
}

function generateHourLabels() {
    const labels = [];
    for (let i = 0; i < 12; i++) {
        const hour = (i * 2).toString().padStart(2, '0');
        labels.push(`${hour}:00`);
    }
    return labels;
}

function updateChartData() {
    // Update chart dengan data terbaru
    if (appState.trendChart) {
        appState.trendChart.data.datasets[0].data = appState.hourlyData;
        appState.trendChart.update('none');
    }
}

// ===================================
// VISITOR DETECTION
// ===================================

function addVisitor(distance = 50) {
    appState.todayVisitors++;
    appState.lastDetectionTime = new Date().toLocaleTimeString('id-ID');
    appState.lastDistance = distance;
    
    // Update hourly data
    const hour = Math.floor(new Date().getHours() / 2);
    appState.hourlyData[hour]++;
    
    // Add to history
    appState.visitorHistory.unshift({
        no: appState.visitorHistory.length + 1,
        time: new Date().toLocaleTimeString('id-ID'),
        status: 'Terdeteksi',
        distance: distance,
        total: appState.todayVisitors,
    });
    
    // Keep only last 50 entries
    if (appState.visitorHistory.length > 50) {
        appState.visitorHistory.pop();
    }
    
    // Save data
    saveToPersistence();
    
    // Update display
    updateAllDisplay();
    
    // Show notification
    showNotification(`👥 Pengunjung terdeteksi! Total: ${appState.todayVisitors}`, 'success');
}

function resetCounter() {
    if (confirm('Apakah Anda yakin ingin mereset counter? Action ini tidak bisa dibatalkan.')) {
        appState.todayVisitors = 0;
        appState.visitorHistory = [];
        appState.hourlyData = new Array(12).fill(0);
        appState.lastDetectionTime = null;
        
        localStorage.removeItem('dashboardData');
        localStorage.removeItem('visitorHistory');
        
        updateAllDisplay();
        showNotification('✓ Counter berhasil direset', 'info');
    }
}

// ===================================
// HISTORY TABLE
// ===================================

function renderHistoryTable(filteredData = null) {
    let data = filteredData || appState.visitorHistory;
    
    if (data.length === 0) {
        historyTableBodyEl.innerHTML = `<tr><td colspan="5" class="no-data">Belum ada data pengunjung</td></tr>`;
        return;
    }
    
    let html = '';
    data.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.time}</td>
                <td><span class="status-badge">${item.status}</span></td>
                <td>${item.distance}</td>
                <td><strong>${item.total}</strong></td>
            </tr>
        `;
    });
    
    historyTableBodyEl.innerHTML = html;
}

function filterHistory() {
    const hour = hourFilterEl.value;
    
    if (!hour) {
        renderHistoryTable();
    } else {
        const filtered = appState.visitorHistory.filter(item => {
            const itemHour = item.time.split(':')[0];
            return itemHour === hour;
        });
        renderHistoryTable(filtered);
    }
}

// ===================================
// EXPORT DATA
// ===================================

function exportData() {
    const csvContent = generateCSV();
    downloadCSV(csvContent, 'visitor-data.csv');
    showNotification('📥 Data berhasil diekspor', 'success');
}

function generateCSV() {
    let csv = 'No.,Waktu,Status,Jarak (cm),Total\n';
    
    appState.visitorHistory.forEach((item, index) => {
        csv += `${index + 1},"${item.time}","${item.status}",${item.distance},${item.total}\n`;
    });
    
    return csv;
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ===================================
// NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let icon = '📌';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

function handleKeyboardShortcuts(e) {
    if (e.key === 'R' || e.key === 'r') {
        refreshData();
    }
    
    if (e.key === 'T' || e.key === 't') {
        addVisitor(Math.floor(Math.random() * 50) + 30);
    }
    
    if (e.key === 'M' || e.key === 'm') {
        switchTabByIndex(0);
    }
    
    if (e.key === 'A' || e.key === 'a') {
        switchTabByIndex(1);
    }
    
    if (e.key === 'H' || e.key === 'h') {
        switchTabByIndex(2);
    }
}

function switchTabByIndex(index) {
    if (tabBtns[index]) {
        tabBtns[index].click();
    }
}

// ===================================
// INITIALIZATION MESSAGE
// ===================================

console.log('✅ Smart Guest Notifier Dashboard Ready');
console.log('💡 Tips:');
console.log('  R - Manual Refresh');
console.log('  T - Test/Simulasi Deteksi');
console.log('  M - Go to Dashboard (Main)');
console.log('  A - Go to Analytics');
console.log('  H - Go to History');
