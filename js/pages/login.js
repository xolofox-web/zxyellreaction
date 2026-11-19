import { state, logActivity } from '../state.js';
import { $, toast } from '../utils.js';

export function renderAdminLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-wrapper">
      <div class="login-visual">
        <div class="login-visual-content">
          <div class="brand-mark" style="width: 48px; height: 48px; font-size: 20px; margin-bottom: 24px;">W</div>
          <h1 style="font-size: 32px; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 12px;">Admin Control<br/>Panel.</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 15px; max-width: 320px;">Area terbatas. Sistem ini hanya dapat diakses oleh administrator yang berwenang.</p>
        </div>
      </div>
      <div class="login-form-side">
        <div class="login-form-container page">
          <div style="margin-top: 40px; margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: 700; letter-spacing: -0.03em;">Sign In</h2>
            <p class="muted text-sm mt-2">Masukkan kredensial administrator.</p>
          </div>
          <form id="admin-login-form" class="stack gap-5">
            <div class="floating-input-group">
              <input id="admin-pass" type="password" class="floating-input" placeholder=" " autofocus />
              <label for="admin-pass" class="floating-label">Password Admin</label>
            </div>
            <button class="btn btn-primary" type="submit" style="height: 48px; border-radius: 12px; font-size: 15px;">Akses Dashboard</button>
          </form>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); text-align: center;">
            <a href="/" class="text-sm subtle" style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Kembali ke Halaman Utama
            </a>
          </div>
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
      toast('Akses diterima.', 'success');
      
      // PAKSA PINDAH HALAMAN (BUKAN PAKAI ROUTER)
      window.location.href = '/admin'; 
    } else {
      toast('Password salah. Akses ditolak.', 'error');
    }
  });
}