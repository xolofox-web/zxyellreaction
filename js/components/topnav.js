import { state } from '../state.js';
import { I } from '../icons.js';

export function topNav() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const path = window.location.pathname;

  return `
    <nav class="topnav">
      <div class="topnav-inner">
        <!-- BRAND BARU: Menggunakan URL Gambar dari GitHub -->
        <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="brand" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
          
          <!-- URL GAMBAR SUDAH DIMASUKKAN DI SINI -->
          <img src="https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20261121_083454_951_zhfb40qe.jpg" 
               alt="zreact" 
               style="width: 24px; height: 24px; object-fit: cover; border-radius: 6px;">
          
          <span class="brand-text" style="font-size: 16px; font-weight: 700; letter-spacing: -0.5px; color: var(--text);">zreact</span>
        </a>
        
        <div class="topnav-links">
          <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="topnav-link ${path === '/' ? 'active' : ''}">Home</a>
          <a href="/history" onclick="event.preventDefault(); window.navigateTo('/history')" class="topnav-link ${path === '/history' ? 'active' : ''}">Riwayat</a>
          <a href="/analytics" onclick="event.preventDefault(); window.navigateTo('/analytics')" class="topnav-link ${path === '/analytics' ? 'active' : ''}">Statistik</a>
        </div>
        <button class="btn-icon" data-theme-toggle onclick="window.toggleTheme()" aria-label="Toggle theme">
          ${isDark ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  `;
}