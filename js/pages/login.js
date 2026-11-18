import { state, logActivity } from '../state.js';
import { $, toast } from '../utils.js';
import { navigateTo } from '../router.js';

export function renderAdminLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-wrapper">
      <!-- Sisi Kiri: Visual & Branding -->
      <div class="login-visual">
        <div class="login-visual-content">
          <div class="brand-mark" style="width: 48px; height: 48px; font-size: 20px; margin-bottom: 24px;">W</div>
          <h1 style="font-size: 32px; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 12px;">Kelola Layanan<br/>Reaction Anda.</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 15px; max-width: 320px;">Akses dashboard untuk memantau antrean, mengelola limit, dan mengatur pengaturan sistem.</p>
        </div>
      </div>

      <!-- Sisi Kanan: Form Login -->
      <div class="login-form-side">
        <div class="login-form-container page">
          <a href="/" onclick="event.preventDefault(); window.navigateTo('/')" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Kembali ke Home
          </a>
          
          <div style="margin-top: 40px; margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: 700; letter-spacing: -0.03em;">Admin Access</h2>
            <p class="muted text-sm mt-2">Masukkan kata sandi untuk melanjutkan.</p>
          </div>

          <form id="admin-login-form" class="stack gap-5">
            <div class="floating-input-group">
              <input id="admin-pass" type="password" class="floating-input" placeholder=" " autofocus />
              <label for="admin-pass" class="floating-label">Password</label>
            </div>
            
            <button class="btn btn-primary" type="submit" style="height: 48px; border-radius: 12px; font-size: 15px;">Masuk Dashboard</button>
          </form>
          
          <!-- Teks Demo Password sudah dihapus -->
        </div>
      </div>
    </div>
  `;
  
  $('#admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#admin-pass').value === state.settings.admin_password) {
      state.isAdmin = true;
      sessionStorage.setItem('wacr_admin', '1');
      logActivity('admin_login', 'Admin login.');
      toast('Selamat datang, admin.', 'success');
      navigateTo('/admin'); // Menggunakan navigateTo
    } else toast('Password salah.', 'error');
  });
}