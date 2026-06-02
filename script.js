/* ===================================
   SMART GUEST NOTIFIER - MAIN SCRIPT (Light Theme)
   =================================== */

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
    searchQuery: ''
};

// ===================================
// DOM ELEMENTS
// ===================================

const todayVisitorCountEl = document.getElementById('todayVisitorCount');
const sensorDistanceEl = document.getElementById('sensorDistance');
const buzzerStatusEl = document.getElementById('buzzerStatus');
const ledStatusEl = document.getElementById('ledStatus');

const systemStatusTextEl = document.getElementById('systemStatusText');
const peakHourEl = document.getElementById('peakHour');
const lastDetectionTimeEl = document.getElementById('lastDetectionTime');
const avgPerHourEl = document.getElementById('avgPerHour');
const peakCountEl = document.getElementById('peakCount');
const trafficIntensityEl = document.getElementById('trafficIntensity');
const lastSyncTimeEl = document.getElementById('lastSyncTime');

const activityLogEl = document.getElementById('activityLog');
const historyTableBodyEl = document.getElementById('historyTableBody');

const refreshBtnEl = document.getElementById('refreshBtn');
const resetBtnEl = document.getElementById('resetBtn');
const exportBtnEl = document.getElementById('exportBtn');
const downloadBtnEl = document.getElementById('downloadBtn');
const searchInputEl = document.getElementById('searchInput');

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    initializeCharts();
    setupEventListeners();
    updateAllDisplay();
    
    setInterval(updateTimestamp, 1000);
    
    showNotification('Dashboard Ready!', 'success');
});

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    refreshBtnEl.addEventListener('click', () => {
        showNotification('Data refreshed', 'success');
        updateAllDisplay();
    });
    
    resetBtnEl.addEventListener('click', resetCounter);
    exportBtnEl.addEventListener('click', exportData);
    if(downloadBtnEl) downloadBtnEl.addEventListener('click', exportData);
    
    if(searchInputEl) {
        searchInputEl.addEventListener('input', (e) => {
            appState.searchQuery = e.target.value.toLowerCase();
            appState.historyPage = 1; // Reset to first page on search
            renderHistoryTable();
        });
    }
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===================================
// DATA HANDLING
// ===================================

function updateBlynkStatus(isConnected) {
    appState.deviceOnline = isConnected;
    const badge = document.getElementById('blynkConnection');
    const text = document.getElementById('blynkStatusText');
    if (badge && text) {
        if (isConnected) {
            badge.classList.add('connected');
            text.textContent = 'Connected to ESP / Blynk';
        } else {
            badge.classList.remove('connected');
            text.textContent = 'Offline - Reconnecting...';
        }
    }
}

function loadInitialData() {
    const savedData = localStorage.getItem('dashboardData');
    if (savedData) {
        const data = JSON.parse(savedData);
        appState.todayVisitors = data.todayVisitors || 0;
        appState.lastDetectionTime = data.lastDetectionTime;
        appState.hourlyData = data.hourlyData || new Array(12).fill(0);
    }
    
    // Simulate connection after 2 seconds
    setTimeout(() => {
        updateBlynkStatus(true);
    }, 2000);
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
// DISPLAY UPDATES
// ===================================

function updateAllDisplay() {
    todayVisitorCountEl.textContent = appState.todayVisitors + '+';
    
    if (appState.lastDetectionTime) {
        lastDetectionTimeEl.textContent = appState.lastDetectionTime;
    }

    const data = appState.hourlyData;
    const avg = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
    avgPerHourEl.textContent = avg;
    
    const peakCount = Math.max(...data);
    peakCountEl.textContent = peakCount;
    
    const maxIndex = data.indexOf(peakCount);
    const pHour = `${(maxIndex * 2).toString().padStart(2, '0')}:00`;
    peakHourEl.textContent = pHour;

    // Traffic Intensity for donut chart
    const intensity = Math.min((appState.todayVisitors / 500) * 100, 100).toFixed(0);
    trafficIntensityEl.textContent = intensity + '%';

    updateChartData();
    renderActivityLog();
    renderHistoryTable();
}

function updateTimestamp() {
    const now = new Date();
    lastSyncTimeEl.textContent = now.toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '-');
}

// ===================================
// VISITOR DETECTION (SIMULATION)
// ===================================

function addVisitor(distance = 25) {
    appState.todayVisitors++;
    appState.lastDetectionTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    appState.lastDistance = distance;
    
    sensorDistanceEl.textContent = distance + ' cm';
    buzzerStatusEl.textContent = 'ON';
    ledStatusEl.textContent = 'ON';
    
    setTimeout(() => {
        buzzerStatusEl.textContent = 'OFF';
        ledStatusEl.textContent = 'OFF';
    }, 2000);
    
    const hour = Math.floor(new Date().getHours() / 2);
    appState.hourlyData[hour]++;
    
    appState.visitorHistory.unshift({
        no: appState.visitorHistory.length + 1,
        time: new Date().toLocaleTimeString('id-ID'),
        status: 'Terdeteksi',
        distance: distance,
        total: appState.todayVisitors,
    });
    
    if (appState.visitorHistory.length > 50) appState.visitorHistory.pop();
    
    saveToPersistence();
    updateAllDisplay();
    showNotification('Pengunjung Terdeteksi!', 'success');
}

function resetCounter() {
    if (confirm('Hapus semua data history?')) {
        appState.todayVisitors = 0;
        appState.visitorHistory = [];
        appState.hourlyData = new Array(12).fill(0);
        appState.lastDetectionTime = null;
        sensorDistanceEl.textContent = '-- cm';
        saveToPersistence();
        updateAllDisplay();
        showNotification('Data dihapus', 'success');
    }
}

// ===================================
// CHARTS
// ===================================

function initializeCharts() {
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
    gradient.addColorStop(0, 'rgba(140, 115, 230, 0.5)'); // purple
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
                tension: 0.4, // Smooth curve
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
                data: [30, 50, 20],
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
    
    // Update donut mock data based on hourly
    if (appState.donutChart) {
        const d = appState.hourlyData;
        const pagi = d.slice(0, 4).reduce((a,b)=>a+b, 0); // 00-08
        const siang = d.slice(4, 9).reduce((a,b)=>a+b, 0); // 08-18
        const malam = d.slice(9, 12).reduce((a,b)=>a+b, 0); // 18-24
        
        if (pagi===0 && siang===0 && malam===0) {
            appState.donutChart.data.datasets[0].data = [1, 1, 1]; // prevent empty
        } else {
            appState.donutChart.data.datasets[0].data = [pagi, siang, malam];
        }
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
    
    let html = '';
    const colors = ['purple', 'blue', 'red'];
    const icons = ['ph-bell-ringing', 'ph-activity', 'ph-warning-circle'];
    
    // Tampilkan max 3
    const displayCount = Math.min(appState.visitorHistory.length, 3);
    for (let i = 0; i < displayCount; i++) {
        const item = appState.visitorHistory[i];
        const color = colors[i % colors.length];
        const icon = icons[i % icons.length];
        
        html += `
        <div class="activity-item">
            <div class="act-time">Baru saja</div>
            <div class="act-icon ${color}"><i class="ph-fill ${icon}"></i></div>
            <div class="act-content">
                <h4>Deteksi Objek</h4>
                <p>Sensor jarak: ${item.distance} cm</p>
            </div>
        </div>`;
    }
    activityLogEl.innerHTML = html;
}

function renderHistoryTable() {
    const paginationControls = document.getElementById('paginationControls');
    const showingText = document.getElementById('showingText');
    
    const filteredHistory = appState.visitorHistory.filter(item => {
        if (!appState.searchQuery) return true;
        return item.time.toLowerCase().includes(appState.searchQuery) ||
               item.distance.toString().includes(appState.searchQuery) ||
               item.status.toLowerCase().includes(appState.searchQuery);
    });
    
    if (filteredHistory.length === 0) {
        historyTableBodyEl.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray">Belum ada data history pengunjung</td></tr>';
        if(paginationControls) paginationControls.innerHTML = '';
        if(showingText) showingText.textContent = appState.searchQuery ? 'Data tidak ditemukan' : 'Menampilkan data history terbaru';
        return;
    }
    
    const totalItems = filteredHistory.length;
    const totalPages = Math.ceil(totalItems / appState.historyItemsPerPage);
    
    if (appState.historyPage > totalPages) appState.historyPage = totalPages;
    if (appState.historyPage < 1) appState.historyPage = 1;
    
    const startIndex = (appState.historyPage - 1) * appState.historyItemsPerPage;
    const endIndex = Math.min(startIndex + appState.historyItemsPerPage, totalItems);
    
    const currentItems = filteredHistory.slice(startIndex, endIndex);
    
    let html = '';
    currentItems.forEach((item) => {
        html += `
        <tr>
            <td>${item.no}</td>
            <td>${item.time}</td>
            <td>${item.distance} cm</td>
            <td>${item.total}</td>
            <td><span class="status-badge alert">Process</span></td>
        </tr>`;
    });
    historyTableBodyEl.innerHTML = html;
    
    if (showingText) {
        showingText.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} data`;
    }
    
    // Render pagination controls
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
        return item.time.toLowerCase().includes(appState.searchQuery) ||
               item.distance.toString().includes(appState.searchQuery) ||
               item.status.toLowerCase().includes(appState.searchQuery);
    });
    const totalPages = Math.ceil(filteredHistory.length / appState.historyItemsPerPage);
    const newPage = appState.historyPage + direction;
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

function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> <span>${message}</span>`;
    container.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function handleKeyboardShortcuts(e) {
    if (e.key === 'T' || e.key === 't') {
        addVisitor(Math.floor(Math.random() * 50) + 10);
    }
}

function exportData() {
    let csv = 'No,Waktu,Jarak (cm),Total,Status\n';
    appState.visitorHistory.forEach(item => {
        csv += `${item.no},${item.time},${item.distance},${item.total},${item.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history.csv';
    a.click();
}
