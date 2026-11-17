import { state } from '../state.js';
import { publicShell } from '../components/shell.js';
import { fmtDate, esc, $, shortId } from '../utils.js';
import { I } from '../icons.js';
import '../export.js'; // register window.exportUserCSV

export function renderHistory() {
  const content = `
    <header class="mb-6">
      <div class="row-between row-wrap gap-4">
        <div>
          <h1 class="h1">Riwayat request</h1>
          <p class="muted mt-2" style="font-size:14px;">Semua request Anda, terbaru di atas.</p>
        </div>
        <button class="btn btn-secondary" onclick="window.exportUserCSV()">${I.download} Export CSV</button>
      </div>
    </header>
    <div class="row gap-2 mb-4" style="flex-wrap:wrap;">
      <select id="h-status" class="select" style="width:auto;min-width:140px;">
        ${['all', 'pending', 'processing', 'success', 'failed'].map(s =>
          `<option value="${s}" ${state.historyFilter.status === s ? 'selected' : ''}>${s === 'all' ? 'Semua status' : s}</option>`
        ).join('')}
      </select>
    </div>
    <div id="history-table"></div>
  `;
  publicShell(content);
  updateHistoryTable();
  $('#h-status')?.addEventListener('change', (e) => {
    state.historyFilter.status = e.target.value;
    state.historyFilter.page = 1;
    updateHistoryTable();
  });
}

function updateHistoryTable() {
  const f = state.historyFilter;
  let list = state.requests.filter(r => r.user_id === state.userId);
  if (f.status !== 'all') list = list.filter(r => r.status === f.status);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / f.pageSize));
  if (f.page > totalPages) f.page = totalPages;
  const start = (f.page - 1) * f.pageSize;
  const items = list.slice(start, start + f.pageSize);

  const el = $('#history-table');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `
      <div class="table-wrap">
        <div class="empty">
          ${I.inbox}
          <div class="empty-title">Belum ada request</div>
          <div class="empty-text">Request yang Anda kirim akan muncul di sini.</div>
          <a href="#/home" class="btn btn-secondary mt-4" style="display:inline-flex;">${I.arrowRight} Buat request</a>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead><tr><th>ID</th><th>Link</th><th>Emoji</th><th>Waktu</th><th>Status</th><th>Error</th></tr></thead>
          <tbody>
            ${items.map(r => `
              <tr>
                <td><code>${shortId(r.id)}</code></td>
                <td class="truncate">${esc(r.channel_url)}</td>
                <td style="font-size:15px;">${esc(r.emojis)}</td>
                <td class="text-xs muted" style="white-space:nowrap;">${fmtDate(r.created_at)}</td>
                <td><span class="badge badge-dot badge-${r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'warning'}">${r.status}</span></td>
                <td class="text-xs" style="color:var(--error);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.error_message || '—')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <div>${start + 1}–${Math.min(start + f.pageSize, total)} dari ${total}</div>
        <div class="pagination">
          <button class="btn-icon" ${f.page <= 1 ? 'disabled' : ''} onclick="window.histPage(-1)" style="${f.page <= 1 ? 'opacity:.3;cursor:not-allowed;' : ''}">${I.chevronLeft}</button>
          <span style="padding:0 8px;font-variant-numeric:tabular-nums;">${f.page} / ${totalPages}</span>
          <button class="btn-icon" ${f.page >= totalPages ? 'disabled' : ''} onclick="window.histPage(1)" style="${f.page >= totalPages ? 'opacity:.3;cursor:not-allowed;' : ''}">${I.chevronRight}</button>
        </div>
      </div>
    </div>`;
}

window.histPage = (d) => {
  state.historyFilter.page = Math.max(1, state.historyFilter.page + d);
  updateHistoryTable();
};