import { state } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderMaintenance } from './pages/maintenance.js';
import { renderAdmin } from './admin/dashboard.js';
import { renderAdminLogin } from './pages/login.js';

export function router() {
  // Mengambil path dari URL (contoh: /admin/overview -> ["admin", "overview"])
  let path = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  const parts = path.split('/');
  const page = parts[0] || 'home';

  /* ----- Guards ----- */

  // Maintenance mode: kunci semua route publik, admin tetap bisa masuk
  if (state.settings.maintenance_mode && page !== 'maintenance' && page !== 'admin' && page !== 'login') {
    window.history.pushState({}, '', '/maintenance');
    return router();
  }

  // Admin harus login
  if (page === 'admin' && !state.isAdmin) {
    window.history.pushState({}, '', '/login');
    return router();
  }

  // Jika sudah login, jangan biarkan buka halaman login lagi
  if (page === 'login' && state.isAdmin) {
    window.history.pushState({}, '', '/admin');
    return router();
  }

  // Kalau user biasa coba akses /maintenance padahal mode normal, balik ke home
  if (page === 'maintenance' && !state.settings.maintenance_mode && !state.isAdmin) {
    window.history.pushState({}, '', '/');
    return router();
  }

  /* ----- Set route + dispatch ----- */
  state.route = page;
  if (page === 'admin') {
    state.admin.tab = parts[1] || 'overview';
  }

  switch (page) {
    case 'home':         renderHome();         break;
    case 'history':      renderHistory();      break;
    case 'analytics':    renderAnalytics();    break;
    case 'admin':        renderAdmin();        break;
    case 'maintenance':  renderMaintenance();  break;
    case 'login':        renderAdminLogin();   break;
    default:             
      window.history.pushState({}, '', '/');
      renderHome();
  }
}

// Fungsi untuk navigasi tanpa me-refresh halaman
export function navigateTo(path) {
  window.history.pushState({}, '', path);
  router();
}

// TAMBAHKAN BARIS INI AGAR TOMBOL BISA DIPANGGIL DARI HTML
window.navigateTo = navigateTo;

// Mendengarkan tombol Back/Forward di browser
window.addEventListener('popstate', router);

export function refresh() {
  if (state.route === 'admin' && state.admin.tab === 'settings') return;
  router();
}