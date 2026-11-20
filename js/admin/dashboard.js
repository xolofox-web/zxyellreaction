import { state, logActivity } from '../state.js';
import { adminShell } from '../components/shell.js';
import { toast } from '../utils.js';
import { I } from '../icons.js';

export async function renderAdmin() {
  if (!state.isAdmin) {
    const { renderAdminLogin } = await import('../pages/login.js');
    return renderAdminLogin();
  }
  
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
    
    // FIX: Tampilkan UI Error yang rapi tanpa me-reload paksa (mencegah loop)
    const isChunkError = error.message && (error.message.includes('dynamically imported module') || error.message.includes('Failed to fetch'));

    return `
      <div class="card" style="padding: 20px; border-left: 4px solid var(--error);">
        <h3 style="color: var(--error); margin-bottom: 8px;">Gagal Memuat Halaman</h3>
        <p class="text-sm">Terjadi kesalahan saat memuat modul <code>${tab}</code>.</p>
        <pre style="background: #222; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto; margin-top: 10px; color:#fff; margin-bottom: 15px;">${error.message}</pre>
        
        ${isChunkError ? `
          <p class="text-sm" style="color: var(--warning); margin-bottom: 12px;">
            <strong>Info:</strong> Browser Anda memegang versi file yang lama. Klik tombol di bawah untuk memuat ulang.
          </p>
          <button class="btn btn-primary btn-sm" onclick="window.location.href = window.location.pathname + '?t=' + Date.now()">Muat Ulang Halaman</button>
        ` : ''}
      </div>
    `;
  }
}

function attachAdminHandlers(tab) {
  const handleImportError = (moduleName, err) => {
    console.error(`Gagal import handler ${moduleName}:`, err);
    toast(`Gagal memuat fitur ${moduleName}. Coba refresh halaman.`, 'error');
  };

  if (tab === 'requests') import('./requests.js').then(m => m.attachRequestsHandlers()).catch(err => handleImportError('requests', err));
  if (tab === 'announcements') import('./announcements.js').then(m => m.attachAnnouncementsHandlers()).catch(err => handleImportError('announcements', err));
  if (tab === 'settings') import('./settings.js').then(m => m.attachSettingsHandlers()).catch(err => handleImportError('settings', err));
  if (tab === 'logs') import('./logs.js').then(m => m.attachLogsHandlers()).catch(err => handleImportError('logs', err));
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