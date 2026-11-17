import { state, logActivity } from '../state.js';
import { $, toast } from '../utils.js';

export function renderAdminLogin() {
  document.getElementById('app').innerHTML = `
    <main class="container">
      <div class="login-card card">
        <div class="card-body" style="text-align:center;padding:32px 24px;">
          <div style="width:48px;height:48px;background:var(--wa);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px;margin-bottom:16px;">A</div>
          <h1 class="h2" style="font-size:18px;">Admin Login</h1>
          <p class="muted text-sm mt-2">Masuk untuk mengakses dashboard.</p>
        </div>
        <div style="padding:0 24px 24px;">
          <form id="admin-login-form" class="stack gap-3">
            <input id="admin-pass" class="input" type="password" placeholder="Password admin" autofocus />
            <button class="btn btn-primary btn-block" type="submit" style="height:38px;">Masuk</button>
          </form>
          <p class="text-xs subtle mt-4" style="text-align:center;">Demo password: <code>admin123</code></p>
          <p class="text-xs mt-2" style="text-align:center;"><a href="#/home" class="subtle">← Kembali ke Home</a></p>
        </div>
      </div>
    </main>
  `;
  $('#admin-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#admin-pass').value === state.settings.admin_password) {
      state.isAdmin = true;
      sessionStorage.setItem('wacr_admin', '1');
      logActivity('admin_login', 'Admin login.');
      toast('Selamat datang, admin.', 'success');
      location.hash = '#/admin';
    } else toast('Password salah.', 'error');
  });
}