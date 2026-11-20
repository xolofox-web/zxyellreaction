import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { fmtTime } from './utils.js';
import './export.js';

// ============================================================================
// 1. SISTEM LOADING ANIMASI
// ============================================================================
function showLoading() {
  if (document.getElementById('global-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    position: fixed; inset: 0; background: #09090b;
    display: flex; flex-direction: column; justify-content: center; align-items: center; 
    z-index: 99999; color: #ffffff; font-family: system-ui, -apple-system, sans-serif;
    transition: opacity 0.4s ease;
  `;
  
  loader.innerHTML = `
    <div style="position: relative; width: 48px; height: 48px;">
      <div style="position: absolute; inset: 0; border: 3px solid rgba(255,255,255,0.05); border-radius: 50%;"></div>
      <div style="position: absolute; inset: 0; border: 3px solid transparent; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;"></div>
    </div>
    <p style="margin-top: 20px; font-size: 14px; color: #a1a1aa; letter-spacing: 0.5px; font-weight: 500;">Menyiapkan aplikasi...</p>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 400);
  }
}

// ============================================================================
// 2. ERROR HANDLER UNTUK DYNAMIC IMPORT DI DALAM APP
// ============================================================================
window.addEventListener('vite:preloadError', (event) => {
  window.location.reload(true);
});
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
    window.location.reload(true);
  }
});

// ============================================================================
// 3. INISIALISASI
// ============================================================================
initTheme();
initState();
let countdownInterval = null;

// ============================================================================
// 4. ROUTING (DENGAN DYNAMIC IMPORT AGAR LEBIH AMAN)
// ============================================================================
async function renderPage() {
  const path = window.location.pathname;
  
  if (countdownInterval) clearInterval(countdownInterval);

  if (sessionStorage.getItem('wacr_admin') === 'true') {
    state.isAdmin = true;
  }

  // Rute Login & Admin
  if (path === '/login' || path.startsWith('/admin')) {
    if (!state.isAdmin) {
      try {
        // Dynamic Import untuk Login
        const { renderAdminLogin, attachLoginHandlers } = await import('./pages/login.js');
        document.body.innerHTML = renderAdminLogin();
        attachLoginHandlers();
      } catch (e) {
        console.error("Gagal memuat halaman login:", e);
        document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;'>Gagal memuat halaman login.</h1>";
      }
    } else {
      try {
        // Dynamic Import untuk Dashboard Admin
        const { renderAdmin } = await import('./admin/dashboard.js');
        renderAdmin();
      } catch (e) {
        console.error("Gagal memuat dashboard:", e);
        document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;'>Gagal memuat dashboard.</h1>";
      }
    }
    return;
  }

  // Rute Publik
  if (path === '/history') {
    renderHistory();
  } else if (path === '/analytics') {
    renderAnalytics();
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
// 5. TIMER
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
// 6. START APP
// ============================================================================
async function initializeApp() {
  showLoading();
  try {
    await syncWithDatabase();
  } catch (error) {
    console.error("Gagal sinkronisasi database:", error);
  } finally {
    await renderPage();
    hideLoading();
  }
}

initializeApp();