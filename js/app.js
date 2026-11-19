import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase, ensureLimit } from './state.js';
import { renderHome } from './pages/home.js';
import { $$, fmtTime } from './utils.js';
import './export.js';

/* ---------- Boot ---------- */
initTheme();
initState();

/* ---------- Render Halaman ---------- */
// Tampilkan halaman depan
try {
  renderHome();
} catch (err) {
  document.getElementById('app').innerHTML = `<h3 style="color:red;padding:20px">Error Render: ${err.message}</h3>`;
}

// Tarik data dari Supabase di latar belakang
syncWithDatabase().then(() => {
  renderHome();
}).catch(err => {
  console.error("Sync Error:", err);
});

/* ---------- Navigasi Sederhana ---------- */
window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  if (path === '/') {
    renderHome();
  } else {
    // Untuk sementara, halaman selain home akan reload
    // (Karena kita sedang fokus membenarkan halaman utama dulu)
    window.location.reload();
  }
};

/* ---------- Countdown timer ---------- */
setInterval(() => {
  const l = ensureLimit();
  $$('[data-countdown]').forEach(el => {
    const ms = l.reset_at - Date.now();
    el.textContent = ms > 0 ? fmtTime(ms) : '00:00:00';
  });
}, 1000);