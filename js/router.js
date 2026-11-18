import { state } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderMaintenance } from './pages/maintenance.js';
import { renderAdmin } from './admin/dashboard.js';
import { renderAdminLogin } from './pages/login.js';

export function router() {
  let path = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  const parts = path.split('/');
  const page = parts[0] || 'home';

  /* ----- Guards ----- */
  if (state.settings && state.settings.maintenance_mode && page !== 'maintenance' && page !== 'admin' && page !== 'login') {
    window.history.pushState({}, '', '/maintenance');
    return router();
  }

  if (page === 'admin' && !state.isAdmin) {
    window.history.pushState({}, '', '/login');
    return router();
  }

  if (page === 'login' && state.isAdmin) {
    window.history.pushState({}, '', '/admin');
    return router();
  }

  if (page === 'maintenance' && state.settings && !state.settings.maintenance_mode && !state.isAdmin) {
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

export function navigateTo(path) {
  window.history.pushState({}, '', path);
  router();
}

window.navigateTo = navigateTo;

export function refresh() {
  if (state.route === 'admin' && state.admin.tab === 'settings') return;
  router();
}