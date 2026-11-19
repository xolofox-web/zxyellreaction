import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { fmtTime } from './utils.js';
import './export.js';

initTheme();
initState();

// Fungsi untuk merender halaman sesuai URL
function renderPage() {
  const path = window.location.pathname;
  if (path === '/history') {
    renderHistory();
  } else if (path === '/analytics') {
    renderAnalytics();
  } else {
    renderHome();
  }
}

// Daftarkan fungsi navigasi ke window agar bisa dipanggil tombol HTML
window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  renderPage();
};

window.addEventListener('popstate', renderPage);

// 1. Tampilkan halaman dulu
renderPage();

// 2. Tarik data dari Supabase, lalu render ulang
syncWithDatabase().then(() => {
  renderPage();
}).catch(err => {
  console.error("Sync Error:", err);
});

// 3. Timer Countdown Limit
setInterval(() => {
  const l = state.limits[state.userId];
  if (!l) return;
  const ms = l.reset_at - Date.now();
  document.querySelectorAll('[data-countdown]').forEach(el => {
    el.textContent = ms > 0 ? fmtTime(ms) : '00:00:00';
  });
}, 1000);