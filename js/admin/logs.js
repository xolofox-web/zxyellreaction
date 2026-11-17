import { state } from '../state.js';
import { fmtDate, esc, $ } from '../utils.js';
import { I } from '../icons.js';

export function renderLogs() {
  if (!state.logs.length) {
    return `
      <div class="table-wrap">
        <div class="empty">
          ${I.activity}
          <div class="empty-title">Belum ada aktivitas</div>
          <div class="empty-text">Aktivitas admin akan tercatat di sini.</div>
        </div>
      </div>
    `;
  }

  const categories = ['all', ...new Set(state.logs.map(l => l.activity))];

  return `
    <div class="row gap-2 mb-4 row-wrap">
      <select id="log-filter" class="select" style="width:auto;min-width:180px;height:36px;">
        ${categories.map(c => `
          <option value="${c}">${c === 'all' ? 'Semua aktivitas' : esc(c)}</option>
        `).join('')}
      </select>
      <div class="ml-auto text-sm muted">${state.logs.length} entri</div>
    </div>
    <div id="logs-table"></div>
  `;
}

export function attachLogsHandlers() {
  updateLogsTable();
  $('#log-filter')?.addEventListener('change', updateLogsTable);
}

function updateLogsTable() {
  const filter = $('#log-filter')?.value || 'all';
  let list = state.logs;
  if (filter !== 'all') list = list.filter(l => l.activity === filter);
  const items = list.slice(0, 200);

  const el = $('#logs-table');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `<div class="table-wrap"><div class="empty">${I.activity}<div class="empty-title">Tidak ada log cocok</div></div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Waktu</th><th>Aktivitas</th><th>Deskripsi</th></tr>
          </thead>
          <tbody>
            ${items.map(l => `
              <tr>
                <td class="text-xs muted" style="white-space:nowrap;">${fmtDate(l.created_at)}</td>
                <td><span class="badge badge-muted">${esc(l.activity)}</span></td>
                <td class="text-sm">${esc(l.description)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <div>Menampilkan ${items.length} dari ${list.length}</div>
      </div>
    </div>
  `;
}