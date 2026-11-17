import { state } from '../state.js';
import { I } from '../icons.js';

export function topNav() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `
    <nav class="topnav">
      <div class="topnav-inner">
        <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="brand">
          <div class="brand-mark">W</div>
          <span class="brand-text">WA Reaction</span>
        </a>
        <div class="topnav-links">
          ${state.isAdmin ? `
            <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="topnav-link">Lihat situs</a>
            <a href="/admin" onclick="event.preventDefault(); window.navigateTo('/admin')" class="topnav-link active">Admin</a>
          ` : `
            <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="topnav-link ${state.route === 'home' ? 'active' : ''}">Home</a>
            <a href="/history" onclick="event.preventDefault(); window.navigateTo('/history')" class="topnav-link ${state.route === 'history' ? 'active' : ''}">Riwayat</a>
            <a href="/analytics" onclick="event.preventDefault(); window.navigateTo('/analytics')" class="topnav-link ${state.route === 'analytics' ? 'active' : ''}">Statistik</a>
            <a href="/login" onclick="event.preventDefault(); window.navigateTo('/login')" class="topnav-link">Admin</a>
          `}
        </div>
        <button class="btn-icon" data-theme-toggle onclick="window.toggleTheme()" aria-label="Toggle theme">
          ${isDark ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  `;
}