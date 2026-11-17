import { state, saveLimits, saveBlacklist, logActivity } from '../state.js';
import { fmtShortDate, shortId, toast } from '../utils.js';
import { I } from '../icons.js';
import { rerenderAdmin } from './dashboard.js';

export function renderUsers() {
  const userIds = Array.from(new Set([...state.requests.map(r => r.user_id), state.userId]));
  const rows = userIds.map(uid => {
    const reqs = state.requests.filter(r => r.user_id === uid);
    const l = state.limits[uid] || { request_count: 0, reset_at: 0, bonus: 0 };
    const lastReq = reqs.reduce((a, b) => Math.max(a, b.created_at), 0);
    const blacklisted = state.blacklist.find(b => b.user_id === uid);
    return { uid, reqs, l, lastReq, blacklisted };
  });

  if (!rows.length) {
    return `<div class="table-wrap"><div class="empty">${I.inbox}<div class="empty-title">Belum ada pengguna</div></div></div>`;
  }

  return `
    <div class="text-sm muted mb-4">${rows.length} pengguna terdaftar</div>
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead><tr><th>ID</th><th>Total</th><th>Sisa Limit</th><th>Reset</th><th>Terakhir</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td><code>${shortId(row.uid)}</code></td>
                <td>${row.reqs.length}</td>
                <td>${Math.max(0, state.settings.daily_limit + (row.l.bonus || 0) - row.l.request_count)}</td>
                <td class="text-xs muted">${row.l.reset_at ? fmtShortDate(row.l.reset_at) : '—'}</td>
                <td class="text-xs muted">${row.lastReq ? fmtShortDate(row.lastReq) : '—'}</td>
                <td>${row.blacklisted ? `<span class="badge badge-dot badge-error">blocked</span>` : `<span class="badge badge-dot badge-success">aktif</span>`}</td>
                <td>
                  <div class="row gap-1">
                    <button class="btn btn-ghost btn-sm" onclick="window.resetUserLimit('${row.uid}')" title="Reset limit">${I.refresh}</button>
                    <button class="btn btn-ghost btn-sm" onclick="window.addBonusLimit('${row.uid}')" title="+5 limit">${I.plus}</button>
                    ${row.blacklisted
                      ? `<button class="btn btn-ghost btn-sm" onclick="window.unblacklistUser('${row.uid}')" title="Unblock">${I.check}</button>`
                      : `<button class="btn btn-ghost btn-sm" onclick="window.blacklistUser('${row.uid}')" title="Block">${I.shield}</button>`}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

window.resetUserLimit = (uid) => {
  if (!state.limits[uid]) state.limits[uid] = { request_count: 0, window_started_at: Date.now(), reset_at: Date.now() + 86400000, bonus: 0 };
  state.limits[uid].request_count = 0;
  state.limits[uid].reset_at = Date.now() + 86400000;
  saveLimits();
  logActivity('reset_limit', `Reset ${shortId(uid)}`);
  toast('Limit direset.', 'success');
  rerenderAdmin();
};
window.addBonusLimit = (uid) => {
  if (!state.limits[uid]) state.limits[uid] = { request_count: 0, window_started_at: Date.now(), reset_at: Date.now() + 86400000, bonus: 0 };
  state.limits[uid].bonus = (state.limits[uid].bonus || 0) + 5;
  saveLimits();
  logActivity('add_limit', `+5 limit ${shortId(uid)}`);
  toast('Bonus +5 limit.', 'success');
  rerenderAdmin();
};
window.blacklistUser = (uid) => {
  const reason = prompt('Alasan blokir:') || 'Tanpa alasan';
  state.blacklist.push({ id: 'b_' + crypto.randomUUID(), user_id: uid, reason, created_at: Date.now() });
  saveBlacklist();
  logActivity('blacklist_user', `Block ${shortId(uid)}: ${reason}`);
  toast('User diblokir.', 'success');
  rerenderAdmin();
};
window.unblacklistUser = (uid) => {
  state.blacklist = state.blacklist.filter(b => b.user_id !== uid);
  saveBlacklist();
  logActivity('unblacklist_user', `Unblock ${shortId(uid)}`);
  toast('Blokir dicabut.', 'success');
  rerenderAdmin();
};