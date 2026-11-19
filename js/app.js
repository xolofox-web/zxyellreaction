import { initTheme } from './theme.js';
import { state, initState, ensureLimit } from './state.js';
import { router } from './router.js';
import { processQueue, onChange } from './queue.js';
import { $$, fmtTime } from './utils.js';
import './export.js'; // mendaftarkan window.exportUserCSV / AllCSV / FilteredCSV

/* ---------- Boot ---------- */
initTheme();
initState();

/* ---------- Router wiring ---------- */
window.addEventListener('hashchange', () => router());

/* ---------- Queue wiring ---------- */
// Halaman yang ingin memicu proses antrean cukup dispatch event ini
document.addEventListener('wacr:queue', () => processQueue());

// Setiap kali queue berubah (status request berubah), render ulang view aktif
// sehingga UI selalu sinkron dengan data
onChange(() => {
  // Jangan re-render kalau sedang di halaman maintenance (route akan redirect sendiri)
  router();
});

/* ---------- Countdown timer ---------- */
// Update semua elemen [data-countdown] tiap detik tanpa render ulang
setInterval(() => {
  const l = ensureLimit();
  $$('[data-countdown]').forEach(el => {
    const ms = l.reset_at - Date.now();
    el.textContent = ms > 0 ? fmtTime(ms) : '00:00:00';
  });
}, 1000);

/* ---------- Queue worker tick ---------- */
// Berjalan otomatis tiap 4 detik untuk memproses pending request
setInterval(() => { processQueue(); }, 4000);

/* ---------- Initial route ---------- */
router();

/* ---------- Expose dev helpers (opsional) ---------- */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__state = state;
  console.log('[dev] state exposed on window.__state');
}