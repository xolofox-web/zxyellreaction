import { state, logActivity } from '../state.js';
import { adminShell } from '../components/shell.js';
import { toast } from '../utils.js';
import { I } from '../icons.js';

export async function renderAdmin() {
  if (!state.isAdmin) {
    const { renderAdminLogin } = await import('../pages/login.js');
    return renderAdminLogin();
  }
  
  // Gunakan optional chaining (?.) untuk mencegah error jika state.admin belum siap
  const tab = state.admin?.tab || 'overview';
  const tabContent = await renderAdminTab(tab);

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
    <div id="admin-body">${tabContent}</div>
  `;
  adminShell(content);
  attachAdminHandlers(tab);
}

async function renderAdminTab(tab) {
  try {
    switch (tab) {
      case 'overview': {
        const { renderOverview } = await import('./overview.js');
        return renderOverview();
      }
      case 'requests': {
        const { renderRequests } = await import('./requests.js');
        return renderRequests();
      }
      case 'users': {
        const { renderUsers } = await import('./users.js');
        return renderUsers();
      }
      case 'announcements': {
        const { renderAnnouncements } = await import('./announcements.js');
        return renderAnnouncements();
      }
      case 'blacklist': {
        const { renderBlacklist } = await import('./blacklist.js');
        return renderBlacklist();
      }
      case 'logs': {
        const { renderLogs } = await import('./logs.js');
        return renderLogs();
      }
      case 'api': {
        const { renderApiMonitor } = await import('./api-monitor.js');
        return renderApiMonitor();
      }
      case 'settings': {
        const { renderSettings } = await import('./settings.js');
        return renderSettings();
      }
      default: return '';
    }
  } catch (error) {
    console.error(`Gagal merender tab ${tab}:`, error);
    // Tampilkan error HANYA di dalam tab, bukan menutup seluruh layar
    return `
      <div class="card" style="padding: 20px; border-left: 4px solid var(--error);">
        <h3 style="color: var(--error); margin-bottom: 8px;">Gagal Memuat Halaman</h3>
        <p class="text-sm">Terjadi kesalahan saat memuat modul <code>${tab}</code>.</p>
        <pre style="background: #222; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto; margin-top: 10px; color:#fff;">${error.message}</pre>
      </div>
    `;
  }
}

function attachAdminHandlers(tab) {
  if (tab === 'requests') {
    import('./requests.js').then(m => m.attachRequestsHandlers()).catch(console.error);
  }
  if (tab === 'announcements') {
    import('./announcements.js').then(m => m.attachAnnouncementsHandlers()).catch(console.error);
  }
  if (tab === 'settings') {
    import('./settings.js').then(m => m.attachSettingsHandlers()).catch(console.error);
  }
  if (tab === 'logs') {
    import('./logs.js').then(m => m.attachLogsHandlers()).catch(console.error);
  }
}

export function rerenderAdmin() { renderAdmin(); }

window.adminLogout = () => {
  state.isAdmin = false;
  sessionStorage.removeItem('wacr_admin');
  logActivity('admin_logout', 'Admin logout.');
  toast('Logout.', 'info');
  
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('/login');
  } else {
    window.location.href = '/login';
  }
};