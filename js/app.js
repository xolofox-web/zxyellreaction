import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
// IMPORT HALAMAN LOGIN DI SINI (Pastikan file pages/login.js ada)
// import { renderLogin } from './pages/login.js'; 
import { fmtTime } from './utils.js';
import './export.js';

// ============================================================================
// 1. SISTEM LOADING ANIMASI (SMOOTH & SIMPEL)
// ============================================================================
function showLoading() {
  // Cek jika loading sudah ada, jangan buat lagi
  if (document.getElementById('global-loader')) return;

  const loader = document.createElement('div');
  loader.id = 'global-loader';
  // Style overlay full screen dengan background gelap
  loader.style.cssText = `
    position: fixed; inset: 0; background: #0f0f0f; 
    display: flex; flex-direction: column; justify-content: center; align-items: center; 
    z-index: 9999; color: #ffffff; font-family: system-ui, -apple-system, sans-serif;
    transition: opacity 0.3s ease;
  `;
  
  // HTML untuk Spinner Animasi
  loader.innerHTML = `
    <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    <p style="margin-top: 16px; font-size: 14px; color: #a1a1aa; letter-spacing: 0.5px;">Memuat data...</p>
  `;
  
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.opacity = '0'; // Efek fade out
    setTimeout(() => loader.remove(), 300);
  }
}

// ============================================================================
// 2. GLOBAL ERROR HANDLER
// ============================================================================
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Stale chunk detected. Reloading page...', event);
  window.location.reload();
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Dynamic import failed. Reloading to get latest version...');
    window.location.reload();
  }
});

// ============================================================================
// 3. INISIALISASI DASAR
// ============================================================================
initTheme();
initState();
let countdownInterval = null;

// ============================================================================
// 4. FUNGSI ROUTING (DIPERBAIKI)
// ============================================================================
function renderPage() {
  const path = window.location.pathname;
  
  if (countdownInterval) clearInterval(countdownInterval);

  if (path === '/history') {
    renderHistory();
  } else if (path === '/analytics') {
    renderAnalytics();
  } else if (path === '/login' || path.startsWith('/admin')) {
    // PERBAIKAN: Render halaman login langsung di SPA, TANPA redirect ke admin.html
    
    // Opsi 1: Jika Anda punya file pages/login.js
    // renderLogin(); 
    
    // Opsi 2: Fallback sementara jika renderLogin belum ada
    document.body.innerHTML = '<h1 style="color:white; text-align:center; margin-top:50px;">Halaman Login Admin (SPA)</h1>'; 
    
    return; // Hentikan render home
  } else {
    renderHome();
  }

  startCountdownTimer();
}

window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  renderPage();
};

window.addEventListener('popstate', renderPage);

// ============================================================================
// 5. LOGIKA TIMER
// ============================================================================
function startCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    if (!state.userId || !state.limits || !state.limits[state.userId]) return;
    
    const l = state.limits[state.userId];
    const ms = l.reset_at - Date.now();
    const elements = document.querySelectorAll('[data-countdown]');
    
    if (elements.length > 0) {
      const timeString = ms > 0 ? fmtTime(ms) : '00:00:00';
      elements.forEach(el => {
        if (el.textContent !== timeString) el.textContent = timeString;
      });
    }
  }, 1000);
}

// ============================================================================
// 6. EKSEKUSI AWAL & SINKRONISASI DATA
// ============================================================================
async function initializeApp() {
  showLoading(); // 1. Tampilkan animasi spinner loading
  
  try {
    await syncWithDatabase(); // 2. Tunggu data dari Supabase
  } catch (error) {
    console.error("Gagal sinkronisasi database:", error);
  } finally {
    renderPage(); // 3. Render halaman (baik berhasil maupun gagal ambil data)
    hideLoading(); // 4. Hilangkan animasi loading dengan mulus
  }
}

initializeApp();