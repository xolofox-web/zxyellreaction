import { state } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderMaintenance } from './pages/maintenance.js';
import { renderAdmin } from './admin/dashboard.js';
import { renderAdminLogin } from './pages/login.js';

export function router() {
  const hash = location.hash.replace(/^#\/?/, '') || 'home';
  const parts = hash.split('/');
  const page = parts[0] || 'home';

  /* ----- Guards ----- */

  // Maintenance mode: kunci semua route publik, admin tetap bisa masuk
  if (state.settings.maintenance_mode && page !== 'maintenance' && page !== 'admin') {
    location.hash = '#/maintenance';
    return;
  }

  // Admin harus login
  if (page === 'admin' && !state.isAdmin) {
    renderAdminLogin();
    return;
  }

  // Kalau user biasa coba akses /maintenance padahal mode normal, balik ke home
  if (page === 'maintenance' && !state.settings.maintenance_mode && !state.isAdmin) {
    location.hash = '#/home';
    return;
  }

  /* ----- Set route + dispatch ----- */
  state.route = page;
  if (page === 'admin') {
    // Support sub-route: #/admin/requests, #/admin/settings, dst.
    state.admin.tab = parts[1] || 'overview';
  }

  switch (page) {
    case 'home':         renderHome();         break;
    case 'history':      renderHistory();      break;
    case 'analytics':    renderAnalytics();    break;
    case 'admin':        renderAdmin();        break;
    case 'maintenance':  renderMaintenance();  break;
    default:             renderHome();
  }
}