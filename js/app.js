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
// 2. ERROR HANDLER
// ============================================================================
window.addEventListener('vite:preloadError', () => window.location.reload(true));
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
// 4. ROUTING
// ============================================================================
async function renderPage() {
  const path = window.location.pathname;
  
  if (countdownInterval) clearInterval(countdownInterval);

  // FIX 1: Cek sesi admin harus menggunakan '1', bukan 'true'
  if (sessionStorage.getItem('wacr_admin') === '1') {
    state.isAdmin = true;
  }

  // --- RUTE LOGIN ---
  if (path === '/login') {
    if (state.isAdmin) {
      window.history.replaceState({}, '', '/admin');
      renderPage();
      return;
    }
    try {
      // FIX 2: Hapus attachLoginHandlers karena fungsi tersebut tidak ada/exportnya
      const { renderAdminLogin } = await import('./pages/login.js');
      const appEl = document.getElementById('app') || document.body;
      appEl.innerHTML = renderAdminLogin(); 
    } catch (e) {
      console.error("Gagal memuat halaman login:", e);
      document.getElementById('app').innerHTML = `<div style="text-align:center; padding:50px; color:white;"><h1>Gagal memuat halaman login.</h1><p style="color:red;">${e.message}</p></div>`;
    }
    return;
  }

  // --- RUTE ADMIN ---
  if (path.startsWith('/admin')) {
    if (!state.isAdmin) {
      window.history.replaceState({}, '', '/login');
      renderPage();
      return;
    }

    let tabFromUrl = 'overview';
    if (path.includes('/admin/requests')) tabFromUrl = 'requests';
    else if (path.includes('/admin/users')) tabFromUrl = 'users';
    else if (path.includes('/admin/announcements')) tabFromUrl = 'announcements';
    else if (path.includes('/admin/blacklist')) tabFromUrl = 'blacklist';
    else if (path.includes('/admin/logs')) tabFromUrl = 'logs';
    else if (path.includes('/admin/api')) tabFromUrl = 'api';
    else if (path.includes('/admin/settings')) tabFromUrl = 'settings';

    if (!state.admin) state.admin = {};
    state.admin.tab = tabFromUrl;

    try {
      const { renderAdmin } = await import('./admin/dashboard.js');
      await renderAdmin(); 
    } catch (e) {
      console.error("Gagal memuat dashboard:", e);
      document.getElementById('app').innerHTML = `
        <div style="text-align:left; padding: 20px; color: #fff; background: #18181b; min-height: 100vh; font-family: monospace;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Gagal memuat Dashboard</h2>
          <pre style="background: #000; padding: 15px; border-radius: 8px; overflow-x: auto; color: #ef4444; border: 1px solid #ef4444;">${e.message}</pre>
        </div>
      `;
    }
    return;
  }

  // --- RUTE PUBLIK ---
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
    // Sinkronisasi data dari Supabase SEBELUM halaman dirender
    await syncWithDatabase();
  } catch (error) {
    console.error("Gagal sinkronisasi database:", error);
  } finally {
    // Setelah data siap, render halaman & hilangkan loading
    await renderPage();
    hideLoading();
  }
}

initializeApp();