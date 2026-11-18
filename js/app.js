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
try {
  router();
} catch (e) {
  console.error("Router Error:", e);
  document.getElementById('app').innerHTML = `<div style="padding:20px;color:red;"><h3>Gagal memuat halaman:</h3><p>${e.message}</p></div>`;
}

// Lalu tarik data dari Supabase di latar belakang
syncWithDatabase().then(() => {
  try {
    router(); // Render ulang setelah data Supabase masuk
  } catch (e) {
    console.error("Sync Router Error:", e);
  }
});

window.addEventListener('popstate', () => {
  try {
    router();
  } catch (e) {
    console.error("Popstate Error:", e);
  }
});

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