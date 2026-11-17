import { state, saveAnnouncements, logActivity } from '../state.js';
import { fmtDate, esc, $, toast } from '../utils.js';
import { I } from '../icons.js';
import { rerenderAdmin } from './dashboard.js';

export function renderAnnouncements() {
  return `
    <div class="card mb-5">
      <div class="card-header"><div class="h3">Tambah pengumuman</div></div>
      <div class="card-body">
        <form id="ann-form" class="stack gap-3">
          <input id="ann-title" class="input" placeholder="Judul" required />
          <textarea id="ann-content" class="textarea" rows="3" placeholder="Isi pengumuman" required></textarea>
          <div class="row gap-2">
            <select id="ann-status" class="select" style="width:auto;">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button class="btn btn-primary" type="submit">${I.plus} Tambah</button>
          </div>
        </form>
      </div>
    </div>
    ${state.announcements.length === 0 ? `
      <div class="table-wrap"><div class="empty">${I.megaphone}<div class="empty-title">Belum ada pengumuman</div></div></div>
    ` : `
      <div class="stack gap-2">
        ${state.announcements.map(a => `
          <div class="card card-pad">
            <div class="row-between gap-3">
              <div style="flex:1;min-width:0;">
                <div class="row gap-2 mb-2">
                  <span class="h3">${esc(a.title)}</span>
                  <span class="badge badge-${a.status === 'published' ? 'success' : 'muted'}">${a.status}</span>
                </div>
                <div class="text-sm muted">${esc(a.content)}</div>
                <div class="text-xs subtle mt-2">${fmtDate(a.created_at)}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="window.delAnn('${a.id}')" title="Hapus">${I.trash}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

export function attachAnnouncementsHandlers() {
  const form = $('#ann-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#ann-title').value.trim();
    const content = $('#ann-content').value.trim();
    const status = $('#ann-status').value;
    if (!title || !content) return;
    state.announcements.unshift({
      id: 'a_' + crypto.randomUUID(),
      title, content, status, created_at: Date.now(),
    });
    saveAnnouncements();
    logActivity('create_announcement', title);
    toast('Pengumuman ditambahkan.', 'success');
    rerenderAdmin();
  });
}

window.delAnn = (id) => {
  if (!confirm('Hapus pengumuman ini?')) return;
  state.announcements = state.announcements.filter(a => a.id !== id);
  saveAnnouncements();
  logActivity('delete_announcement', `Hapus pengumuman ${id}`);
  toast('Pengumuman dihapus.', 'info');
  rerenderAdmin();
};