import { state, saveRequests, logActivity } from '../state.js';
import { fmtDate, esc, shortId, $, toast } from '../utils.js';
import { I } from '../icons.js';
import '../export.js';

export function renderRequests() {
  return `
    <div class="row gap-2 mb-4" style="flex-wrap:wrap;">
      <input id="adm-search" class="input" style="max-width:280px;height:36px;" placeholder="Cari URL, ID, user…" value="${esc(state.admin.requestFilter.search)}" />
      <select id="adm-status" class="select" style="width:auto;height:36px;min-width:140px;">
        <option value="all" ${state.admin.requestFilter.status === 'all' ? 'selected' : ''}>Semua status</option>
        ${['pending', 'processing', 'success', 'failed'].map(s =>
          `<option value="${s}" ${state.admin.requestFilter.status === s ? 'selected' : ''}>${s}</option>`
        ).join('')}
      </select>
      <div class="ml-auto row gap-2">
        <button class="btn btn-secondary btn-sm" onclick="window.exportAllCSV()">${I.download} Semua</button>
        <button class="btn btn-secondary btn-sm" onclick="window.exportFilteredCSV('success')">Berhasil</button>
        <button class="btn btn-secondary btn-sm" onclick="window.exportFilteredCSV('failed')">Gagal</button>
      </div>
    </div>
    <div id="adm-requests-table"></div>`;
}

export function attachRequestsHandlers() {
  updateTable();
  $('#adm-search')?.addEventListener('input', (e) => {
    state.admin.requestFilter.search = e.target.value;
    state.admin.requestFilter.page = 1;
    updateTable();
  });
  $('#adm-status')?.addEventListener('change', (e) => {
    state.admin.requestFilter.status = e.target.value;
    state.admin.requestFilter.page = 1;
    updateTable();
  });
}

function updateTable() {
  const f = state.admin.requestFilter;
  let list = [...state.requests];
  if (f.status !== 'all') list = list.filter(r => r.status === f.status);
  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter(r => (r.channel_url + ' ' + r.emojis + ' ' + r.id + ' ' + r.user_id).toLowerCase().includes(q));
  }
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / f.pageSize));
  if (f.page > totalPages) f.page = totalPages;
  const start = (f.page - 1) * f.pageSize;
  const items = list.slice(start, start + f.pageSize);

  const el = $('#adm-requests-table');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `<div class="table-wrap"><div class="empty">${I.inbox}<div class="empty-title">Tidak ada data</div><div class="empty-text">Coba ubah filter atau kata kunci.</div></div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead><tr><th>ID</th><th>User</th><th>Link</th><th>Emoji</th><th>Waktu</th><th>Status</th><th>Error</th><th></th></tr></thead>
          <tbody>
            ${items.map(r => `
              <tr>
                <td><code>${shortId(r.id)}</code></td>
                <td><code>${shortId(r.user_id)}</code></td>
                <td class="truncate" style="max-width:160px;">${esc(r.channel_url)}</td>
                <td style="font-size:15px;">${esc(r.emojis)}</td>
                <td class="text-xs muted" style="white-space:nowrap;">${fmtDate(r.created_at)}</td>
                <td><span class="badge badge-dot badge-${r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'warning'}">${r.status}</span></td>
                <td class="text-xs" style="color:var(--error);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.error_message || '—')}</td>
                <td>${r.status === 'failed' ? `<button class="btn btn-ghost btn-sm" onclick="window.retryRequest('${r.id}')" title="Retry">${I.refresh}</button>` : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <div>${start + 1}–${Math.min(start + f.pageSize, total)} dari ${total}</div>
        <div class="pagination">
          <button class="btn-icon" onclick="window.admReqPage(-1)" style="${f.page <= 1 ? 'opacity:.3;cursor:not-allowed;' : ''}">${I.chevronLeft}</button>
          <span style="padding:0 8px;">${f.page} / ${totalPages}</span>
          <button class="btn-icon" onclick="window.admReqPage(1)" style="${f.page >= totalPages ? 'opacity:.3;cursor:not-allowed;' : ''}">${I.chevronRight}</button>
        </div>
      </div>
    </div>`;
}

window.admReqPage = (d) => {
  state.admin.requestFilter.page = Math.max(1, state.admin.requestFilter.page + d);
  updateTable();
};
window.retryRequest = (id) => {
  const r = state.requests.find(x => x.id === id);
  if (!r) return;
  r.status = 'pending';
  r.retry_count = 0;
  r.error_message = null;
  r.completed_at = null;
  saveRequests();
  logActivity('retry_request', `Manual retry ${shortId(id)}`);
  toast('Request dijadwalkan ulang.', 'info');
  updateTable();
  document.dispatchEvent(new CustomEvent('wacr:queue'));
};