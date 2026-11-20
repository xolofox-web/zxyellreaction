import { state } from '../state.js';
import { toast } from '../utils.js';
import { I } from '../icons.js';

export function renderAdminLogin() {
  // Render UI Login
  return `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; background: var(--bg-body);">
      <div class="card" style="width: 100%; max-width: 400px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 12px; display: inline-flex; justify-content: center; align-items: center; color: white; margin-bottom: 16px;">
            ${I.shield} <!-- Pastikan icon shield ada di icons.js Anda -->
          </div>
          <h1 class="h2" style="margin-bottom: 8px;">Admin Panel</h1>
          <p class="text-sm muted">Masukkan password untuk melanjutkan</p>
        </div>

        <form id="admin-login-form" class="stack gap-4">
          <div class="field">
            <label class="label">Password</label>
            <input id="admin-pass" type="password" class="input" placeholder="••••••••" required autocomplete="current-password" />
            <div id="login-err" class="error-text" style="display: none; color: var(--error); font-size: 13px; margin-top: 6px;"></div>
          </div>
          <button type="submit" class="btn btn-primary" style="height: 42px; margin-top: 8px;">
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  `;
}

export function attachLoginHandlers() {
  const form = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-pass');
  const errDiv = document.getElementById('login-err');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errDiv.style.display = 'none';
    
    const pass = passInput.value;
    const correctPass = state.settings.admin_password || 'admin123'; // Fallback jika kosong

    if (pass === correctPass) {
      state.isAdmin = true;
      sessionStorage.setItem('wacr_admin', 'true');
      
      // Arahkan ke halaman dashboard admin
      window.history.pushState({}, '', '/admin');
      // Trigger render ulang aplikasi
      window.dispatchEvent(new Event('popstate')); 
      
      toast('Login berhasil!', 'success');
    } else {
      errDiv.textContent = 'Password salah. Silakan coba lagi.';
      errDiv.style.display = 'block';
      passInput.value = '';
      passInput.focus();
    }
  });
}