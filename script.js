/**
 * SMART GUEST NOTIFIER - REPAIR SCRIPT V5.0
 * Dark Glassmorphism UI with full Blynk IoT integration
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
    
    // Initialize UI components
    generateMiniCalendar();
    setupInteractiveControls();
    setupMobileNav();
    setupNavLinks();
    initCharts();
    
    // Initial fetch and loop
    fetchBlynkData();
    setInterval(fetchBlynkData, 5000);
});

/* ===================================
   MINI CALENDAR GENERATOR
   =================================== */
function generateMiniCalendar() {
    const container = document.getElementById('miniCalendar');
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    let html = '<div class="cal-header">';
    dayNames.forEach(d => {
        html += `<span>${d}</span>`;
    });
    html += '</div><div class="cal-grid">';

    // Empty slots before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<span class="cal-day inactive"></span>';
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today ? ' today' : '';
        html += `<span class="cal-day${isToday}">${d}</span>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

/* ===================================
   MOBILE NAVIGATION
   =================================== */
function setupMobileNav() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileNavOverlay');
    
    if (menuBtn && overlay) {
        menuBtn.addEventListener('click', () => {
            overlay.classList.toggle('show');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('mobile-nav-link')) {
                overlay.classList.remove('show');
            }
        });
    }
}

/* ===================================
   NAV LINKS INTERACTION
   =================================== */
function setupNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

/* ===================================
   BLYNK DATA FETCHING
   =================================== */
async function fetchBlynkData() {
    const url = `${_URL}/get?token=${_AUTH}&V0&V1&V2&V3`;
    const hwStatusUrl = `${_URL}/isHardwareConnected?token=${_AUTH}`;
    
    try {
        const [response, hwResponse] = await Promise.all([
            fetch(url),
            fetch(hwStatusUrl)
        ]);
        
        if (!response.ok) throw new Error("Status: " + response.status);
        
        const data = await response.json();
        const hwConnected = await hwResponse.text();
        const isOnline = hwConnected.trim() === "true";
        
        console.log("📥 Data Blynk diterima:", data);

        // --- 1. Visitor Count (V0) ---
        const v0 = extractPinValue(data, 'V0', 0);
        const currentVisitorCount = parseInt(v0) || 0;
        document.getElementById('todayVisitorCount').textContent = currentVisitorCount;

        // Update circle progress
        updateCircleProgress(currentVisitorCount);

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
            if (currentVisitorCount > 0 || currentExitCount > 0) {
                updateCharts(currentVisitorCount);
                addActivityLog("Sistem Terhubung", `Total masuk: ${currentVisitorCount}, keluar: ${currentExitCount}`, "purple", "ph-fill ph-power");
                addHistoryTableRow("-", "normal", "Sistem Aktif", currentVisitorCount);
            }
        } else {
            if (currentVisitorCount > lastVisitorCount) {
                if (currentHour >= 7 && currentHour < 9) {
                    showNotification("Karyawan Masuk Kerja!", "var(--color-purple)");
                    addActivityLog("Karyawan Masuk", "Karyawan masuk ke area", "purple", "ph-fill ph-user-check");
                    addHistoryTableRow("-", "normal", "Karyawan Masuk", currentVisitorCount);
                } else {
                    showNotification("Tamu Umum Masuk!", "var(--color-blue)");
                    addActivityLog("Tamu Masuk", "Tamu umum terdeteksi", "blue", "ph-fill ph-user");
                    addHistoryTableRow("-", "normal", "Tamu Masuk", currentVisitorCount);
                }
                updateCharts(currentVisitorCount);
            }
            
            if (currentExitCount > lastExitCount) {
                showNotification("Karyawan Pulang!", "var(--color-red)");
                addActivityLog("Karyawan Pulang", "Karyawan meninggalkan area", "red", "ph-fill ph-sign-out");
                addHistoryTableRow("-", "alert", "Karyawan Keluar", currentExitCount);
            }
        }

        lastVisitorCount = currentVisitorCount;
        lastExitCount = currentExitCount;

        // --- 3. Status Buzzer (V2) ---
        const v2 = extractPinValue(data, 'V2', 0);
        const buzEl = document.getElementById('buzzerStatus');
        const buzToggle = document.getElementById('buzzerToggle');
        const isBuzOn = parseInt(v2);
        if (buzEl) buzEl.textContent = isBuzOn ? 'ON' : 'OFF';
        if (buzToggle) {
            if (isBuzOn) buzToggle.classList.add('active');
            else buzToggle.classList.remove('active');
        }

        // --- 4. Status LED (V3) ---
        const v3 = extractPinValue(data, 'V3', 0);
        const ledEl = document.getElementById('ledStatus');
        if (ledEl) ledEl.textContent = parseInt(v3) ? 'ON' : 'OFF';

        // Update ctrl buttons states
        updateCtrlButtonStates(isBuzOn, parseInt(v3));

        // Update UI based on actual Hardware Status
        if (isOnline) {
            updateConnectionUI(true, "Connected to ESP");
        } else {
            updateConnectionUI(false, "ESP is Offline");
        }

        // Update timestamps
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const lastSyncEl = document.getElementById('lastSyncTime');
        if (lastSyncEl) lastSyncEl.textContent = timeStr;
        
        // Update the display method
        const methodDisplay = document.getElementById('paymentMethodDisplay');
        if (methodDisplay) methodDisplay.textContent = isOnline ? 'Active' : 'Offline';
        
        const lastDetEl = document.getElementById('lastDetectionTime');
        if (lastDetEl && (currentVisitorCount > 0 || currentExitCount > 0)) lastDetEl.textContent = timeStr;

        // Update intensity slider
        updateIntensitySlider(currentVisitorCount);

    } catch (err) {
        console.error("❌ Sync Error:", err);
        updateConnectionUI(false, "API Error / Offline");
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

/* ===================================
   CIRCLE PROGRESS UPDATE
   =================================== */
function updateCircleProgress(count) {
    const circleFill = document.getElementById('heroCircleFill');
    if (!circleFill) return;
    
    const maxCount = 50; // Scale: 50 visitors = full circle
    const percentage = Math.min(count / maxCount, 1);
    const circumference = 2 * Math.PI * 42; // r=42
    const offset = circumference - (percentage * circumference);
    
    circleFill.style.strokeDasharray = circumference;
    circleFill.style.strokeDashoffset = offset;
}

/* ===================================
   INTENSITY SLIDER UPDATE
   =================================== */
function updateIntensitySlider(count) {
    const fill = document.getElementById('intensitySlider');
    const thumb = document.getElementById('intensityThumb');
    if (!fill || !thumb) return;

    const maxCount = 50;
    const pct = Math.min((count / maxCount) * 100, 100);
    fill.style.width = pct + '%';
    thumb.style.left = pct + '%';
}

/* ===================================
   CONTROL BUTTON STATES
   =================================== */
function updateCtrlButtonStates(buzzerOn, ledOn) {
    const buzzerBtn = document.getElementById('buzzerCtrlBtn');
    const ledBtn = document.getElementById('ledCtrlBtn');
    
    if (buzzerBtn) {
        if (buzzerOn) buzzerBtn.classList.add('active-ctrl');
        else buzzerBtn.classList.remove('active-ctrl');
    }
    if (ledBtn) {
        if (ledOn) ledBtn.classList.add('active-ctrl');
        else ledBtn.classList.remove('active-ctrl');
    }
}

/* ===================================
   INTERACTIVE CONTROLS
   =================================== */
function setupInteractiveControls() {
    // Reset Total Keluar
    const resetKeluarBtn = document.getElementById('resetKeluarBtn');
    if (resetKeluarBtn) {
        resetKeluarBtn.onclick = async () => {
            if(confirm("Reset 'Total Keluar' ke 0?")) {
                try {
                    await fetch(`${_URL}/update?token=${_AUTH}&V1=0`);
                    lastExitCount = -1;
                    const exitEl = document.getElementById('exitCount');
                    if (exitEl) exitEl.textContent = '0';
                    showNotification("Total Keluar direset", "var(--color-pink)");
                    setTimeout(fetchBlynkData, 500);
                } catch(e) { console.error(e); }
            }
        };
    }

    // Toggle Buzzer
    const buzzerToggle = document.getElementById('buzzerToggle');
    const buzzerStatus = document.getElementById('buzzerStatus');
    if (buzzerToggle && buzzerStatus) {
        buzzerToggle.onclick = async () => {
            const current = buzzerStatus.textContent.trim() === 'ON' ? 0 : 1;
            buzzerStatus.textContent = current ? 'ON' : 'OFF';
            if (current) buzzerToggle.classList.add('active');
            else buzzerToggle.classList.remove('active');
            
            console.log("Sending Buzzer Update:", current);
            try {
                await fetch(`${_URL}/update?token=${_AUTH}&V2=${current}`);
            } catch(e) { console.error(e); }
            setTimeout(fetchBlynkData, 1000);
        };
    }

    // Buzzer button shortcut
    const buzzerCtrlBtn = document.getElementById('buzzerCtrlBtn');
    if (buzzerCtrlBtn) {
        buzzerCtrlBtn.onclick = () => {
            if (buzzerToggle) buzzerToggle.click();
        };
    }

    // Toggle LED via button
    const ledCtrlBtn = document.getElementById('ledCtrlBtn');
    const ledStatus = document.getElementById('ledStatus');
    if (ledCtrlBtn && ledStatus) {
        ledCtrlBtn.onclick = async () => {
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
            refreshBtn.classList.add('spinning');
            
            fetchBlynkData().then(() => {
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                    showNotification("Data berhasil diperbarui!", "var(--color-blue)");
                }, 500);
            }).catch(() => {
                refreshBtn.classList.remove('spinning');
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
        let csvContent = "sep=,\nNO,WAKTU,JARAK,AKUMULASI,STATUS\n";
        
        let hasData = false;
        rows.forEach(row => {
            if(row.querySelector('td[colspan]')) return; 
            hasData = true;
            const cols = row.querySelectorAll('td');
            const rowData = Array.from(cols).map(c => `"${c.textContent.trim()}"`).join(",");
            csvContent += rowData + "\n";
        });
        
        if(!hasData) {
            alert("Tidak ada data untuk didownload!");
            return;
        }

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Pengunjung_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', exportCSV);
}

/* ===================================
   CONNECTION UI
   =================================== */
function updateConnectionUI(online, msg) {
    const badge = document.getElementById('blynkConnection');
    const sysText = document.getElementById('systemStatusText');
    
    if (badge) {
        badge.className = online ? 'user-dot online connected' : 'user-dot online';
        if (!online) {
            badge.style.background = 'rgba(248, 113, 113, 0.15)';
            badge.style.color = '#f87171';
            badge.style.borderColor = '#f87171';
        } else {
            badge.style.background = '';
            badge.style.color = '';
            badge.style.borderColor = '';
        }
    }
    
    if (sysText) {
        sysText.textContent = online ? 'Online' : 'Offline';
        sysText.className = online ? 'hero-stat-value online' : 'hero-stat-value';
    }
}

/* ===================================
   NOTIFICATIONS
   =================================== */
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

/* ===================================
   CHARTS
   =================================== */
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
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.08)',
                    fill: true,
                    tension: 0.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    pointHoverBackgroundColor: '#34d399',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { display: false, beginAtZero: true }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(20, 30, 20, 0.9)',
                        titleColor: '#f0f5f0',
                        bodyColor: '#a8e6a3',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
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
                    backgroundColor: ['#34d399', '#60a5fa', '#a78bfa'],
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

    // Update Progress Bars
    if (total > 0) {
        const pagiPct = Math.round((donutChartInstance.data.datasets[0].data[0] / total) * 100);
        const siangPct = Math.round((donutChartInstance.data.datasets[0].data[1] / total) * 100);
        const malamPct = Math.round((donutChartInstance.data.datasets[0].data[2] / total) * 100);

        const progPagi = document.getElementById('progPagi');
        const pctPagi = document.getElementById('pctPagi');
        if(progPagi) progPagi.style.width = pagiPct + '%';
        if(pctPagi) pctPagi.textContent = pagiPct + '%';

        const progSiang = document.getElementById('progSiang');
        const pctSiang = document.getElementById('pctSiang');
        if(progSiang) progSiang.style.width = siangPct + '%';
        if(pctSiang) pctSiang.textContent = siangPct + '%';

        const progMalam = document.getElementById('progMalam');
        const pctMalam = document.getElementById('pctMalam');
        if(progMalam) progMalam.style.width = malamPct + '%';
        if(pctMalam) pctMalam.textContent = malamPct + '%';
    }
}

/* ===================================
   ACTIVITY LOG
   =================================== */
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

/* ===================================
   HISTORY TABLE
   =================================== */
function addHistoryTableRow(distanceVal, statusBadge, statusText, accVal) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    if(tbody.querySelector('.text-center')) {
        tbody.innerHTML = '';
    }
    
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const no = tbody.children.length + 1;
    const currentTotal = accVal !== undefined ? accVal : (document.getElementById('todayVisitorCount').textContent || 0);
    
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
