import { topNav } from './topnav.js';
import { state } from '../state.js';
import { I } from '../icons.js';

export function publicShell(content) {
  document.getElementById('app').innerHTML = `
    ${topNav()}
    <main class="container page">${content}</main>
    <footer class="container" style="padding-top:0;color:var(--text-3);font-size:12px;">
      <div class="row-between" style="border-top:1px solid var(--border);padding-top:20px;">
        <span>© ${new Date().getFullYear()} WA Reaction · Demo single-page</span>
        <a href="/login" onclick="event.preventDefault(); window.navigateTo('/login')" style="color:var(--text-3);">Admin</a>
      </div>
    </footer>
  `;
}

export function adminShell(content) {
  const tabs = [
    ['overview', 'Overview', 'grid'],
    ['requests', 'Requests', 'list'],
    ['users', 'Users', 'user'],
    ['announcements', 'Pengumuman', 'megaphone'],
    ['blacklist', 'Blacklist', 'shield'],
    ['logs', 'Activity Logs', 'activity'],
    ['api', 'API Monitor', 'zap'],
    ['settings', 'Settings', 'settings'],
  ];
  const active = state.admin.tab;
  
  // Menggunakan navigateTo()
  const tabHTML = ([k, label, ic]) => `
    <div class="nav-item ${active === k ? 'active' : ''}" onclick="window.navigateTo('/admin/${k}')">
      ${I[ic]}<span>${label}</span>
    </div>
  `;

  document.getElementById('app').innerHTML = `
    ${topNav()}
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-section">Dashboard</div>
        ${tabs.slice(0, 3).map(tabHTML).join('')}
        <div class="sidebar-section" style="margin-top:12px;">Manajemen</div>
        ${tabs.slice(3, 7).map(tabHTML).join('')}
        <div class="sidebar-section" style="margin-top:12px;">Sistem</div>
        ${tabs.slice(7).map(tabHTML).join('')}
        <div class="sidebar-section" style="margin-top:12px;">Sesi</div>
        <div class="nav-item" onclick="window.adminLogout()">
          ${I.logout}<span>Logout</span>
        </div>
      </aside>
      <main class="admin-main page">${content}</main>
    </div>
  `;
}