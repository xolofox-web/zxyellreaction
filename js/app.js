import { initTheme } from './theme.js';
import { state, initState, syncWithDatabase } from './state.js';
import { renderHome } from './pages/home.js';
import { renderHistory } from './pages/history.js';
import { renderAnalytics } from './pages/analytics.js';
import { fmtTime } from './utils.js';
import './export.js';

// ============================================================================
// 1. GLOBAL ERROR HANDLER (Mengatasi Error "Failed to fetch module" di gambar)
// ============================================================================
// Menangkap error jika ada dynamic import (chunk) yang gagal dimuat 
// karena deploy baru (Stale Chunk). Aplikasi akan otomatis reload.
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Stale chunk detected. Reloading page...', event);
  window.location.reload();
});

// Fallback untuk bundler lain atau error jaringan umum saat import
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Dynamic import failed. Reloading to get latest version...');
    window.location.reload();
  }
});

// ============================================================================
// 2. INISIALISASI DASAR
// ============================================================================
initTheme();
initState();

// Variabel untuk menyimpan referensi Timer agar tidak terjadi multiple intervals
let countdownInterval = null;

// ============================================================================
// 3. FUNGSI ROUTING
// ============================================================================
function renderPage() {
  const path = window.location.pathname;
  
  // Bersihkan interval lama setiap kali pindah halaman
  if (countdownInterval) clearInterval(countdownInterval);

  if (path === '/history') {
    renderHistory();
  } else if (path === '/analytics') {
    renderAnalytics();
  } else if (path === '/login' || path.startsWith('/admin')) {
    // PERBAIKAN: Hindari infinite loop. 
    // Jika admin.html adalah file terpisah, arahkan ke file tersebut.
    // Jika SPA yang menangani, hapus baris ini dan buat renderAdmin().
    if (!window.location.pathname.endsWith('.html')) {
        // Berasumsi file terpisah bernama admin.html
        window.location.href = '/admin.html'; 
    }
    return; // Hentikan eksekusi render selanjutnya
  } else {
    renderHome();
  }

  // Mulai timer hanya jika bukan halaman admin/login
  startCountdownTimer();
}

window.navigateTo = (path) => {
  window.history.pushState({}, '', path);
  renderPage();
};

window.addEventListener('popstate', renderPage);

// ============================================================================
// 4. LOGIKA TIMER (Dioptimalkan)
// ============================================================================
function startCountdownTimer() {
  // Hapus interval sebelumnya jika ada
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    // Pastikan state dan userId tersedia sebelum mengakses limits
    if (!state.userId || !state.limits || !state.limits[state.userId]) return;
    
    const l = state.limits[state.userId];
    const ms = l.reset_at - Date.now();
    
    // Update DOM
    const elements = document.querySelectorAll('[data-countdown]');
    if (elements.length > 0) {
      const timeString = ms > 0 ? fmtTime(ms) : '00:00:00';
      elements.forEach(el => {
        // Hanya update textContent jika nilainya berubah (mencegah reflow)
        if (el.textContent !== timeString) {
            el.textContent = timeString;
        }
      });
    }
  }, 1000);
}

// ============================================================================
// 5. EKSEKUSI AWAL & SINKRONISASI DATA
// ============================================================================
// PERBAIKAN: Tampilkan loading state di HTML awal, jangan render dulu.
// Render hanya setelah data dari Supabase siap.
async function initializeApp() {
  try {
    // Tampilkan indikator loading (opsional, tergantung HTML Anda)
    // document.body.innerHTML = '<div class="loading">Memuat data...</div>';

    await syncWithDatabase();
    
    // Setelah data siap, baru render halaman
    renderPage(); 
  } catch (error) {
    console.error("Gagal sinkronisasi database:", error);
    // Tetap render halaman default (home) meskipun database gagal, 
    // atau tampilkan pesan error ke pengguna.
    renderPage();
  }
}

// Jalankan aplikasi
initializeApp();