import { state } from '../state.js';
import { I } from '../icons.js';

export function topNav() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const path = window.location.pathname;

  return `
    <nav class="topnav">
      <div class="topnav-inner">
        <!-- BRAND BARU: Menggunakan Logo Gambar dan Teks zreact -->
        <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="brand" style="display:flex; align-items:center; gap:8px;">
          <img src="/logo.png" alt="zreact" style="width: 24px; height: 24px; object-fit: contain;">
          <span class="brand-text" style="font-size: 16px; font-weight: 700; letter-spacing: -0.5px;">zreact</span>
        </a>
        
        <div class="topnav-links">
          <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="topnav-link ${path === '/' ? 'active' : ''}">Home</a>
          <a href="/history" onclick="event.preventDefault(); window.navigateTo('/history')" class="topnav-link ${path === '/history' ? 'active' : ''}">Riwayat</a>
          <a href="/analytics" onclick="event.preventDefault(); window.navigateTo('/analytics')" class="topnav-link ${path === '/analytics' ? 'active' : ''}">Statistik</a>
          
          <!-- FIX: Menu Admin sudah dihapus total dari sini -->
        </div>
        <button class="btn-icon" data-theme-toggle onclick="window.toggleTheme()" aria-label="Toggle theme">
          ${isDark ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  `;
}