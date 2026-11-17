import { state, saveBlacklist, logActivity } from '../state.js';
import { fmtDate, esc, shortId, toast } from '../utils.js';
import { I } from '../icons.js';
import { rerenderAdmin } from './dashboard.js';

export function renderBlacklist() {
  if (!state.blacklist.length) {
    return `
      <div class="table-wrap">
        <div class="empty">
          ${I.shield}
          <div class="empty-title">Tidak ada user diblokir</div>
          <div class="empty-text">User yang diblokir akan muncul di sini.</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="row-between mb-4 row-wrap gap-2">
      <div class="text-sm muted">${state.blacklist.length} user diblokir</div>
      <button class="btn btn-secondary btn-sm" onclick="window.exportBlacklistCSV()">
        ${I.download} Export CSV
      </button>
    </div>
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>User ID</th><th>Alasan</th><th>Tanggal Blokir</th><th></th></tr>
          </thead>
          <tbody>
            ${state.blacklist.map(b => `
              <tr>
                <td><code>${shortId(b.user_id)}</code></td>
                <td class="text-sm">${esc(b.reason)}</td>
                <td class="text-xs muted" style="white-space:nowrap;">${fmtDate(b.created_at)}</td>
                <td>
                  <div class="row gap-1">
                    <button class="btn btn-ghost btn-sm" onclick="window.unblacklistUser('${b.user_id}')" title="Copot blokir">
                      ${I.check}
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="window.removeBlacklist('${b.user_id}')" title="Hapus entri">
                      ${I.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.unblacklistUser = (uid) => {
  state.blacklist = state.blacklist.filter(b => b.user_id !== uid);
  saveBlacklist();
  logActivity('unblacklist_user', `Unblock ${shortId(uid)}`);
  toast('Blokir dicabut.', 'success');
  rerenderAdmin();
};

window.removeBlacklist = (uid) => {
  if (!confirm('Hapus entri blacklist ini?')) return;
  state.blacklist = state.blacklist.filter(b => b.user_id !== uid);
  saveBlacklist();
  logActivity('remove_blacklist', `Hapus entri blacklist ${shortId(uid)}`);
  toast('Entri dihapus.', 'info');
  rerenderAdmin();
};

window.exportBlacklistCSV = () => {
  const rows = [
    ['User ID', 'Alasan', 'Tanggal'],
    ...state.blacklist.map(b => [b.user_id, b.reason, fmtDate(b.created_at)])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `blacklist-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Blacklist CSV diunduh.', 'success');
};