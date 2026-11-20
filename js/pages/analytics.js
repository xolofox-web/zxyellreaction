import { state, ensureLimit } from '../state.js';
import { publicShell } from '../components/shell.js';
import { fmtDate } from '../utils.js';

export function renderAnalytics() {
  // FIX: Gunakan device_id
  const reqs = state.requests.filter(r => r.device_id === state.userId);
  
  const total = reqs.length;
  const success = reqs.filter(r => r.status === 'success').length;
  const failed = reqs.filter(r => r.status === 'failed').length;
  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  const successRate = total ? Math.round((success / total) * 100) : 0;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + 86400000;
    
    const count = reqs.filter(r => {
      const time = new Date(r.created_at).getTime();
      return !isNaN(time) && time >= start && time < end;
    }).length;
    
    days.push({ label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), count });
  }
  
  const maxCount = Math.max(1, ...days.map(d => d.count));
  const chartW = 560, chartH = 140, padX = 8, padY = 20;
  const gap = (chartW - padX * 2) / days.length;
  const barW = Math.min(28, gap * 0.55);
  const bars = days.map((d, i) => {
    const h = (d.count / maxCount) * (chartH - padY * 2);
    const x = padX + i * gap + (gap - barW) / 2;
    const y = chartH - padY - h;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${h || 1}" rx="3" fill="${d.count ? 'var(--wa)' : 'var(--border)'}"/>
            <text x="${x + barW / 2}" y="${chartH - 4}" text-anchor="middle" font-size="10" fill="var(--text-3)" font-family="Inter">${d.label}</text>`;
  }).join('');

  const content = `
    <header class="mb-6">
      <h1 class="h1">Statistik pribadi</h1>
      <p class="muted mt-2" style="font-size:14px;">Ringkasan penggunaan layanan Anda.</p>
    </header>
    <div class="stats mb-6">
      <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>
      <div class="stat"><div class="stat-label">Berhasil</div><div class="stat-value success">${success}</div></div>
      <div class="stat"><div class="stat-label">Gagal</div><div class="stat-value error">${failed}</div></div>
      <div class="stat"><div class="stat-label">Sisa Limit</div><div class="stat-value">${Math.max(0, max - l.request_count)}<span style="font-size:13px;color:var(--text-3);font-weight:500;"> /${max}</span></div></div>
    </div>
    <div class="analytics-grid">
      <div class="card">
        <div class="card-header"><div class="h3">Aktivitas 7 hari terakhir</div></div>
        <div class="card-body"><svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto;">${bars}</svg></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="h3">Penggunaan limit</div></div>
        <div class="card-body">
          <div class="row-between mb-2" style="font-size:13px;">
            <span class="muted">${l.request_count} terpakai</span>
            <span class="muted">dari ${max}</span>
          </div>
          <div class="progress" style="height:8px;"><div class="progress-fill ${l.request_count / max > 0.85 ? 'warning' : ''}" style="width:${Math.min(100, (l.request_count / max) * 100)}%;"></div></div>
          <div class="mt-4 text-sm muted">Reset pada <span class="mono">${fmtDate(l.reset_at)}</span></div>
          <div class="mt-3 text-sm muted">Tingkat keberhasilan: <strong style="color:var(--text);">${successRate}%</strong></div>
        </div>
      </div>
    </div>`;
  publicShell(content);
}