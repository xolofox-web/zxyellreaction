import { state } from '../state.js';
import { I } from '../icons.js';

export function renderOverview() {
  const requests = state.requests || [];
  const total = requests.length;
  const success = requests.filter(r => r.status === 'success').length;
  const failed = requests.filter(r => r.status === 'failed').length;
  const pending = requests.filter(r => r.status === 'pending' || r.status === 'processing').length;
  
  // FIX: Gunakan device_id bukan user_id
  const users = new Set(requests.map(r => r.device_id)).size;
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const today = requests.filter(r => {
    const reqTime = new Date(r.created_at).getTime();
    return !isNaN(reqTime) && reqTime >= todayStart.getTime();
  }).length;
  
  const successRate = total ? Math.round((success / total) * 100) : 0;

  const isMaintenance = state.settings?.maintenance_mode;
  const isSimulation = state.settings?.simulation_mode;

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
            <span class="badge badge-dot ${isMaintenance ? 'badge-error' : 'badge-success'}">${isMaintenance ? 'Maintenance' : 'Online'}</span>
          </div>
          <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
            <span class="muted">Mode simulasi</span>
            <span class="badge badge-dot ${isSimulation ? 'badge-warning' : 'badge-success'}">${isSimulation ? 'Aktif' : 'Nonaktif'}</span>
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
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('settings')" style="justify-content:flex-start;">${I.settings} Ubah pengaturan</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('requests')" style="justify-content:flex-start;">${I.list} Lihat semua request</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('announcements')" style="justify-content:flex-start;">${I.megaphone} Kelola pengumuman</button>
          <button class="btn btn-secondary btn-block" onclick="window.exportAllCSV()" style="justify-content:flex-start;">${I.download} Export data CSV</button>
        </div>
      </div>
    </div>`;
}

window.switchAdminTab = (tabName) => {
  if (typeof window.navigateTo === 'function') {
    window.navigateTo('/admin/' + tabName);
  } else {
    window.location.href = '/admin/' + tabName;
  }
};

window.exportAllCSV = async function() {
  try {
    const exportModule = await import('../export.js');
    if (exportModule.exportAllCSV) exportModule.exportAllCSV();
    else if (exportModule.default) exportModule.default();
  } catch (err) {
    console.error('Gagal memuat export.js:', err);
    alert('Fitur Export CSV sedang tidak tersedia. (Gagal memuat modul).');
  }
};