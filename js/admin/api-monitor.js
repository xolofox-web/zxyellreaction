import { state } from '../state.js';
import { fmtDate, esc, $, toast } from '../utils.js';
import { I } from '../icons.js';

export function renderApiMonitor() {
  const total = state.apiLogs.length;
  const ok = state.apiLogs.filter(l => l.status === 'success').length;
  const fail = total - ok;
  const avg = total ? Math.round(state.apiLogs.reduce((a, b) => a + (b.response_time_ms || 0), 0) / total) : 0;
  const healthy = fail <= ok;
  const successRate = total ? Math.round((ok / total) * 100) : 0;

  // Endpoint sekarang dipegang oleh Backend Vercel (/api/reaction)
  const API_ENDPOINT = 'Internal Vercel Serverless (/api/reaction)';

  return `
    <div class="stats mb-6">
      <div class="stat">
        <div class="stat-label">API Calls</div>
        <div class="stat-value">${total}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Sukses</div>
        <div class="stat-value success">${ok}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Gagal</div>
        <div class="stat-value error">${fail}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Avg Latency</div>
        <div class="stat-value">${avg}<span style="font-size:13px;color:var(--text-3);font-weight:500;">ms</span></div>
      </div>
    </div>

    <div class="card mb-5">
      <div class="card-header">
        <div class="h3">Konfigurasi Endpoint</div>
      </div>
      <div style="padding:8px 0;">
        <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;gap:12px;">
          <span class="muted" style="flex-shrink:0;">Endpoint</span>
          <code style="font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(API_ENDPOINT)}</code>
        </div>
        <div class="row-between" style="padding:12px 20px;border-bottom:1px solid var(--border);font-size:13px;">
          <span class="muted">Success rate</span>
          <span style="font-weight:500;">${successRate}%</span>
        </div>
        <div class="row-between" style="padding:12px 20px;font-size:13px;">
          <span class="muted">Kesehatan</span>
          <span class="badge badge-dot ${healthy ? 'badge-success' : 'badge-error'}">${healthy ? 'Healthy' : 'Degraded'}</span>
        </div>
      </div>
    </div>

    ${!state.apiLogs.length
      ? `<div class="table-wrap"><div class="empty">${I.zap}<div class="empty-title">Belum ada request API</div><div class="empty-text">Log akan muncul setelah request diproses.</div></div></div>`
      : `<div class="table-wrap">
          <div class="table-scroll">
            <table>
              <thead><tr><th>Waktu</th><th>Status</th><th>HTTP</th><th>Latency</th><th>Error</th></tr></thead>
              <tbody>
                ${state.apiLogs.slice(0, 50).map(l => `
                  <tr>
                    <td class="text-xs muted">${fmtDate(l.created_at)}</td>
                    <td><span class="badge badge-dot badge-${l.status === 'success' ? 'success' : 'error'}">${l.status}</span></td>
                    <td class="mono" style="font-size:12px;">${l.http_status || '—'}</td>
                    <td class="mono" style="font-size:12px;">${l.response_time_ms || '—'}ms</td>
                    <td class="text-xs" style="color:var(--error);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(l.error || '—')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`}
  `;
}
