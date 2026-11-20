import { state, logActivity } from '../state.js';
import { adminShell } from '../components/shell.js';
import { renderOverview } from './overview.js';
import { renderRequests } from './requests.js';
import { renderUsers } from './users.js';
import { renderAnnouncements } from './announcements.js';
import { renderBlacklist } from './blacklist.js';
import { renderLogs } from './logs.js';
import { renderApiMonitor } from './api-monitor.js';
import { renderSettings } from './settings.js';
import { renderAdminLogin } from '../pages/login.js';
import { toast } from '../utils.js';
import { I } from '../icons.js';
// PERBAIKAN: Import '../router.js' DIHAPUS karena file tersebut tidak ada.

export function renderAdmin() {
  if (!state.isAdmin) return renderAdminLogin();
  const tab = state.admin.tab;

  const content = `
    <header class="mb-6">
      <div class="row-between row-wrap gap-3">
        <div>
          <h1 class="h1" style="font-size:22px;">Dashboard Admin</h1>
          <p class="muted text-sm mt-2">Kelola seluruh layanan dari satu tempat.</p>
        </div>
        <div class="row gap-2">
          <button class="btn btn-secondary btn-sm" onclick="window.adminLogout()">${I.logout} Logout</button>
        </div>
      </div>
    </header>
    <div id="admin-body">${renderAdminTab(tab)}</div>
  `;
  adminShell(content);
  attachAdminHandlers(tab);
}

function renderAdminTab(tab) {
  switch (tab) {
    case 'overview': return renderOverview();
    case 'requests': return renderRequests();
    case 'users': return renderUsers();
    case 'announcements': return renderAnnouncements();
    case 'blacklist': return renderBlacklist();
    case 'logs': return renderLogs();
    case 'api': return renderApiMonitor();
    case 'settings': return renderSettings();
    default: return '';
  }
}

function attachAdminHandlers(tab) {
  if (tab === 'requests') {
    import('./requests.js').then(m => m.attachRequestsHandlers());
  }
  if (tab === 'announcements') {
    import('./announcements.js').then(m => m.attachAnnouncementsHandlers());
  }
  if (tab === 'settings') {
    import('./settings.js').then(m => m.attachSettingsHandlers());
  }
}

export function rerenderAdmin() { renderAdmin(); }

window.adminLogout = () => {
  state.isAdmin = false;
  sessionStorage.removeItem('wacr_admin');
  logActivity('admin_logout', 'Admin logout.');
  toast('Logout.', 'info');
  
  // PERBAIKAN: Gunakan window.navigateTo yang sudah ada di app.js
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('/login');
  } else {
    window.location.href = '/login';
  }
};