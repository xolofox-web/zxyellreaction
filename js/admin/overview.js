import { state } from '../state.js';
import { I } from '../icons.js';
import '../export.js';

export function renderOverview() {
  const total = state.requests.length;
  const success = state.requests.filter(r => r.status === 'success').length;
  const failed = state.requests.filter(r => r.status === 'failed').length;
  const pending = state.requests.filter(r => r.status === 'pending' || r.status === 'processing').length;
  const users = new Set(state.requests.map(r => r.user_id)).size;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = state.requests.filter(r => r.created_at >= todayStart.getTime()).length;
  const successRate = total ? Math.round((success / total) * 100) : 0;

  return `
    <div class="stats mb-6">
      <div class="stat"><div class="stat-label">Total Request</div><div class="stat-value">${total}</div></div>
      <div class="stat"><div class="stat-label">Berhasil</div><div class="stat-value success">${success}</div></div>
      <div class="stat"><div class="stat-label">Gagal</div><div class="stat-value error">${failed}</div></div>
      <div class="stat"><div class="stat-label">Hari Ini</div><div class="stat-value">${today}</div></div>
    </div>
    <div class="overview-grid">
      <div class="card">
        <div class="card-header"><div class="h3">Ringkasan sistem</div></div>
        <div style="padding:8px 0;">
          <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
            <span class="muted">Status layanan</span>
            <span class="badge badge-dot ${state.settings.maintenance_mode ? 'badge-error' : 'badge-success'}">${state.settings.maintenance_mode ? 'Maintenance' : 'Online'}</span>
          </div>
          <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
            <span class="muted">Mode simulasi</span>
            <span class="badge badge-dot ${state.settings.simulation_mode ? 'badge-warning' : 'badge-success'}">${state.settings.simulation_mode ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
            <span class="muted">Request diproses</span><span style="font-weight:500;">${pending}</span>
          </div>
          <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
            <span class="muted">Total pengguna</span><span style="font-weight:500;">${users}</span>
          </div>
          <div class="row-between" style="padding:12px 20px;font-size:13px;">
            <span class="muted">Success rate</span><span style="font-weight:500;">${successRate}%</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="h3">Aksi cepat</div></div>
        <div class="card-body stack gap-2">
          <!-- Navigasi tab admin yang sudah diperbaiki -->
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('settings')" style="justify-content:flex-start;">${I.settings} Ubah pengaturan</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('requests')" style="justify-content:flex-start;">${I.list} Lihat semua request</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('announcements')" style="justify-content:flex-start;">${I.megaphone} Kelola pengumuman</button>
          <button class="btn btn-secondary btn-block" onclick="window.exportAllCSV()" style="justify-content:flex-start;">${I.download} Export data CSV</button>
        </div>
      </div>
    </div>`;
}

// Fungsi untuk pindah tab di dalam dashboard tanpa reload halaman
window.switchAdminTab = (tabName) => {
  import('../state.js').then(({ state }) => {
    state.admin.tab = tabName;
    import('./dashboard.js').then(({ rerenderAdmin }) => {
      rerenderAdmin();
    });
  });
};