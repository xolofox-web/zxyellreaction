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
// 4. ROUTING (DIPERBAIKI: LOGIN & ADMIN DIPISAH)
// ============================================================================
async function renderPage() {
  const path = window.location.pathname;
  
  if (countdownInterval) clearInterval(countdownInterval);

  // Cek Sesi Admin
  if (sessionStorage.getItem('wacr_admin') === 'true') {
    state.isAdmin = true;
  }

  // --- RUTE LOGIN (Murni untuk Login) ---
  if (path === '/login') {
    // Jika sudah login tapi buka /login, lempar ke /admin
    if (state.isAdmin) {
      window.history.replaceState({}, '', '/admin');
      renderPage();
      return;
    }

    try {
      const { renderAdminLogin, attachLoginHandlers } = await import('./pages/login.js');
      // Gunakan #app agar tidak menghapus toast-wrap atau loader
      const appEl = document.getElementById('app') || document.body;
      appEl.innerHTML = renderAdminLogin();
      attachLoginHandlers();
    } catch (e) {
      console.error("Gagal memuat halaman login:", e);
      document.getElementById('app').innerHTML = `<div style="text-align:center; padding:50px; color:white;"><h1>Gagal memuat halaman login.</h1><p style="color:red;">${e.message}</p></div>`;
    }
    return;
  }

  // --- RUTE ADMIN (Murni untuk Dashboard) ---
  if (path.startsWith('/admin')) {
    // Jika belum login, tendang ke /login
    if (!state.isAdmin) {
      window.history.replaceState({}, '', '/login');
      renderPage();
      return;
    }

    try {
      const { renderAdmin } = await import('./admin/dashboard.js');
      await renderAdmin(); // WAJIB pakai await agar error tertangkap
    } catch (e) {
      console.error("Gagal memuat dashboard:", e);
      // Tampilkan pesan error asli ke layar agar Anda tahu file mana yang hilang
      document.getElementById('app').innerHTML = `
        <div style="text-align:left; padding: 20px; color: #fff; background: #18181b; min-height: 100vh; font-family: monospace;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Gagal memuat Dashboard</h2>
          <p style="color: #a1a1aa; margin-bottom: 5px;">Penyebab error:</p>
          <pre style="background: #000; padding: 15px; border-radius: 8px; overflow-x: auto; color: #ef4444; border: 1px solid #ef4444;">${e.message}</pre>
          <p style="color: #a1a1aa; margin-top: 20px; font-size: 13px;">Buka Console Browser (F12) untuk detail lebih lanjut, atau pastikan semua file di dalam folder /admin sudah lengkap (terutama config.js).</p>
        </div>
      `;
    }
    return;
  }

  // --- RUTE PUBLIK (Home, History, Analytics) ---
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