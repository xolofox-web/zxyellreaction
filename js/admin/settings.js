import { state, saveSettings, logActivity } from '../state.js';
import { esc, $, toast } from '../utils.js';
import { I } from '../icons.js';
import { rerenderAdmin } from './dashboard.js';

export function renderSettings() {
  const s = state.settings;
  const Toggle = (name, label, checked) => `
    <label class="checkbox-row">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} />
      <span>${label}</span>
    </label>
  `;

  return `
    <form id="settings-form" class="stack gap-5" style="max-width:640px;">

      <div class="card">
        <div class="card-header"><div class="h3">Limit & Validasi</div></div>
        <div class="card-body stack gap-4">
          <div class="field">
            <label class="label">Daily limit per pengguna</label>
            <input class="input" name="daily_limit" type="number" min="1" value="${s.daily_limit}" />
            <div class="helper">Jumlah request yang tersedia per 24 jam.</div>
          </div>
          <div class="field">
            <label class="label">Maksimal emoji per request</label>
            <input class="input" name="max_emojis" type="number" min="1" value="${s.max_emojis}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="h3">Pesan</div></div>
        <div class="card-body stack gap-4">
          <div class="field">
            <label class="label">Pesan maintenance</label>
            <textarea class="textarea" name="maintenance_message" rows="2">${esc(s.maintenance_message)}</textarea>
            <div class="helper">Ditampilkan di halaman maintenance.</div>
          </div>
          <div class="field">
            <label class="label">Pesan notifikasi</label>
            <input class="input" name="notification_message" value="${esc(s.notification_message)}" placeholder="(opsional)" />
            <div class="helper">Tampil di bawah form request pengguna.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="h3">Perilaku</div></div>
        <div class="card-body stack gap-3">
          ${Toggle('service_enabled', 'Layanan aktif', s.service_enabled)}
          ${Toggle('maintenance_mode', 'Maintenance mode', s.maintenance_mode)}
          ${Toggle('simulation_mode', 'Simulation mode (tanpa API nyata)', s.simulation_mode)}
          ${Toggle('auto_retry', 'Auto retry request gagal', s.auto_retry)}
          <div class="field mt-3">
            <label class="label">Max retries</label>
            <input class="input" name="max_retries" type="number" min="0" value="${s.max_retries}" />
            <div class="helper">Batas percobaan ulang otomatis untuk error sementara.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="h3">Keamanan</div></div>
        <div class="card-body">
          <div class="field">
            <label class="label">Password admin baru</label>
            <input class="input" name="admin_password" type="text" placeholder="Biarkan kosong jika tidak diubah" />
            <div class="helper">Demo menyimpan plaintext; produksi gunakan hash.</div>
          </div>
        </div>
      </div>

      <div class="row gap-2" style="flex-wrap:wrap;">
        <button class="btn btn-primary" type="submit" style="height:38px;">Simpan perubahan</button>
        <button class="btn btn-danger" type="button" onclick="window.hardReset()">${I.trash} Reset semua data</button>
      </div>
    </form>
  `;
}

export function attachSettingsHandlers() {
  const form = $('#settings-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    state.settings.daily_limit = Math.max(1, parseInt(fd.get('daily_limit'), 10) || 20);
    state.settings.max_emojis = Math.max(1, parseInt(fd.get('max_emojis'), 10) || 5);
    state.settings.maintenance_message = fd.get('maintenance_message') || '';
    state.settings.notification_message = fd.get('notification_message') || '';
    state.settings.max_retries = Math.max(0, parseInt(fd.get('max_retries'), 10) || 0);
    state.settings.service_enabled = !!fd.get('service_enabled');
    state.settings.maintenance_mode = !!fd.get('maintenance_mode');
    state.settings.simulation_mode = !!fd.get('simulation_mode');
    state.settings.auto_retry = !!fd.get('auto_retry');

    const newPass = String(fd.get('admin_password') || '').trim();
    if (newPass) {
      state.settings.admin_password = newPass;
      logActivity('change_password', 'Password admin diubah.');
    }

    saveSettings();
    logActivity('update_settings', 'Pengaturan sistem diperbarui.');
    toast('Pengaturan disimpan.', 'success');

    // Kalau maintenance diaktifkan untuk user, redirect keluar akan terjadi otomatis
    rerenderAdmin();
  });
}

window.hardReset = () => {
  if (!confirm('Hapus SEMUA data (request, settings, log, dll)? Tindakan ini tidak dapat dibatalkan.')) return;
  Object.keys(localStorage)
    .filter(k => k.startsWith('wacr_'))
    .forEach(k => localStorage.removeItem(k));
  location.reload();
};