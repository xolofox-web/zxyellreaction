import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { router } from './router.js';
import { fmtTime } from './utils.js';
import './export.js'; // mendaftarkan window.exportUserCSV / AllCSV / FilteredCSV

/* ---------- Boot ---------- */
initTheme();
initState();

/* ---------- Router wiring ---------- */
// Tampilkan halaman dulu
router();

// Lalu tarik data dari Supabase di latar belakang
syncWithDatabase().then(() => {
  router(); // Render ulang setelah data Supabase masuk
});

window.addEventListener('popstate', router);

/* ---------- Countdown timer ---------- */
setInterval(() => {
  const l = state.limits[state.userId];
  if (!l) return;
  const ms = l.reset_at - Date.now();
  document.querySelectorAll('[data-countdown]').forEach(el => {
    el.textContent = ms > 0 ? fmtTime(ms) : '00:00:00';
  });
}, 1000);

/* ---------- Expose dev helpers ---------- */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__state = state;
  console.log('[dev] state exposed on window.__state');
}