import { state } from '../state.js';
import { I } from '../icons.js';

export function topNav() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const path = window.location.pathname;

  return `
    <nav class="topnav">
      <div class="topnav-inner">
        <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="brand">
          <div class="brand-mark">W</div>
          <span class="brand-text">WA Reaction</span>
        </a>
        <div class="topnav-links">
          <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="topnav-link ${path === '/' ? 'active' : ''}">Home</a>
          <a href="/history" onclick="event.preventDefault(); window.navigateTo('/history')" class="topnav-link ${path === '/history' ? 'active' : ''}">Riwayat</a>
          <a href="/analytics" onclick="event.preventDefault(); window.navigateTo('/analytics')" class="topnav-link ${path === '/analytics' ? 'active' : ''}">Statistik</a>
          
          <!-- LINK ADMIN MENGGUNAKAN HREF BIASA KARENA PINDAH FILE -->
          <a href="/login" class="topnav-link">Admin</a>
        </div>
        <button class="btn-icon" data-theme-toggle onclick="window.toggleTheme()" aria-label="Toggle theme">
          ${isDark ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  `;
}