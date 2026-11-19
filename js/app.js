import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { fmtTime } from './utils.js';
import './export.js';

initTheme();
initState();

function renderPage() {
  const path = window.location.pathname;
  
  if (path === '/history') {
    renderHistory();
  } else if (path === '/analytics') {
    renderAnalytics();
  } else if (path === '/login' || path.startsWith('/admin')) {
    // Paksa buka halaman admin.html secara terpisah
    window.location.href = path; 
  } else {
    renderHome();
  }
}

window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  renderPage();
};

window.addEventListener('popstate', renderPage);

// Render awal
renderPage();

// Tarik data Supabase
syncWithDatabase().then(() => {
  const path = window.location.pathname;
  if (path !== '/login' && !path.startsWith('/admin')) {
    renderPage(); // Jangan re-render kalau sedang pindah ke Admin
  }
});

setInterval(() => {
  const l = state.limits[state.userId];
  if (!l) return;
  const ms = l.reset_at - Date.now();
  document.querySelectorAll('[data-countdown]').forEach(el => {
    el.textContent = ms > 0 ? fmtTime(ms) : '00:00:00';
  });
}, 1000);