import { state } from '../state.js';
import { I } from '../icons.js';

export function topNav() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `
    <nav class="topnav">
      <div class="topnav-inner">
        <a href="#/home" class="brand">
          <div class="brand-mark">W</div>
          <span class="brand-text">WA Reaction</span>
        </a>
        <div class="topnav-links">
          ${state.isAdmin ? `
            <a href="#/home" class="topnav-link">Lihat situs</a>
            <a href="#/admin" class="topnav-link active">Admin</a>
          ` : `
            <a href="#/home" class="topnav-link ${state.route === 'home' ? 'active' : ''}">Home</a>
            <a href="#/history" class="topnav-link ${state.route === 'history' ? 'active' : ''}">Riwayat</a>
            <a href="#/analytics" class="topnav-link ${state.route === 'analytics' ? 'active' : ''}">Statistik</a>
            <a href="#/admin" class="topnav-link">Admin</a>
          `}
        </div>
        <button class="btn-icon" data-theme-toggle onclick="window.toggleTheme()" aria-label="Toggle theme">
          ${isDark ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  `;
}