import { state, ensureLimit, isBlacklisted, syncWithDatabase } from '../state.js';
import { publicShell } from '../components/shell.js';
import { isValidChannelUrl, parseEmojis } from '../validation.js';
import { fmtTime, fmtDate, fmtShortDate, esc, $, toast } from '../utils.js';
import { I } from '../icons.js';
import { callRealAPI } from '../api.js';

export function renderHome() {
  const prevUrl = $('#f-url')?.value || '';
  const prevEmoji = $('#f-emoji')?.value || '';

  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  const remaining = Math.max(0, max - l.request_count);
  const announcements = state.announcements.filter(a => a.status === 'published');
  
  const userReqs = state.requests.filter(r => r.device_id === state.userId);
  const pending = state.requests.filter(r => (r.status === 'pending' || r.status === 'processing') && r.device_id === state.userId);

  const stats = {
    total: userReqs.length,
    success: userReqs.filter(r => r.status === 'success').length,
    failed: userReqs.filter(r => r.status === 'failed').length,
  };
  const disabled = state.settings.maintenance_mode || !state.settings.service_enabled || isBlacklisted() || remaining <= 0;
  const progressPct = Math.min(100, (remaining / max) * 100);
  const progressClass = remaining === 0 ? 'error' : remaining / max < 0.25 ? 'warning' : '';

  const content = `
    <header class="mb-8">
      <h1 class="h1">Kirim reaction ke<br/>channel WhatsApp</h1>
      <p class="muted mt-2" style="font-size:15px;max-width:480px;">Tempel link channel, pilih emoji, dan biarkan sistem memproses otomatis.</p>
    </header>

    ${state.settings.maintenance_mode ? `
      <div class="card mb-4" style="border-color:var(--error);background:var(--error-bg);padding:14px 16px;">
        <div class="row gap-2" style="color:var(--error);font-size:13px;">${I.alert}<span><strong>Maintenance:</strong> ${esc(state.settings.maintenance_message)}</span></div>
      </div>` : ''}
    ${isBlacklisted() ? `
      <div class="card mb-4" style="border-color:var(--error);background:var(--error-bg);padding:14px 16px;">
        <div class="row gap-2" style="color:var(--error);font-size:13px;">${I.alert}<span><strong>Akses ditolak:</strong> Akun Anda diblokir.</span></div>
      </div>` : ''}

    <div class="stats mb-8">
      <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${stats.total}</div></div>
      <div class="stat"><div class="stat-label">Berhasil</div><div class="stat-value success">${stats.success}</div></div>
      <div class="stat"><div class="stat-label">Gagal</div><div class="stat-value error">${stats.failed}</div></div>
      <div class="stat"><div class="stat-label">Sisa Limit</div><div class="stat-value">${remaining}<span style="font-size:13px;color:var(--text-3);font-weight:500;"> /${max}</span></div></div>
    </div>

    <div class="home-grid">
      <div>
        <div class="card">
          <div class="card-header">
            <div>
              <div class="h2">Buat request</div>
              <div class="text-sm muted mt-2" style="margin-top:2px;">Satu request = satu kredit limit</div>
            </div>
            <span class="badge badge-dot ${remaining > 0 ? 'badge-success' : 'badge-error'}">${remaining > 0 ? 'Tersedia' : 'Habis'}</span>
          </div>
          <div class="card-body">
            <form id="request-form" class="stack gap-5">
              <div class="field">
                <label class="label">Link WhatsApp Channel</label>
                <input id="f-url" class="input" type="url" placeholder="https://whatsapp.com/channel/…" ${disabled ? 'disabled' : ''} autocomplete="off" value="${esc(prevUrl)}" />
                <div id="f-url-err" class="error-text" style="display:none;"></div>
                <div class="helper">Format: whatsapp.com/channel/[ID]</div>
              </div>
              <div class="field">
                <label class="label">Emoji <span class="subtle" style="font-weight:400;">— pisahkan dengan koma</span></label>
                <input id="f-emoji" class="input" type="text" placeholder="❤️,🔥,😍,👍,💯" ${disabled ? 'disabled' : ''} autocomplete="off" value="${esc(prevEmoji)}" />
                <div id="f-emoji-err" class="error-text" style="display:none;"></div>
                <div class="helper">Maksimal ${state.settings.max_emojis} emoji per request</div>
              </div>
              ${state.settings.notification_message ? `
                <div class="row gap-2" style="font-size:12.5px;color:var(--text-2);background:var(--surface-2);padding:10px 12px;border-radius:var(--radius);">
                  ${I.info}<span>${esc(state.settings.notification_message)}</span>
                </div>` : ''}
              <div class="row gap-3" style="flex-wrap:wrap;">
                <button type="submit" class="btn btn-wa" ${disabled ? 'disabled' : ''} style="height:38px;padding:0 18px;">${I.zap} Kirim request</button>
                <span class="text-sm subtle" style="margin-left:auto;">Reset dalam <span data-countdown class="mono">${fmtTime(l.reset_at - Date.now())}</span></span>
              </div>
            </form>
            <div class="mt-5"><div class="progress"><div class="progress-fill ${progressClass}" style="width:${progressPct}%;"></div></div></div>
          </div>
        </div>
      </div>

      <aside class="stack gap-4">
        <div class="card">
          <div class="card-header"><div class="h3">Pengumuman</div></div>
          <div style="padding:8px;">
            ${announcements.length === 0 ? `
              <div class="empty" style="padding:24px 16px;">${I.inbox}<div class="empty-title">Belum ada pengumuman</div></div>
            ` : announcements.slice(0, 4).map(a => `
              <div style="padding:12px;border-radius:var(--radius);">
                <div class="h3" style="font-size:13.5px;">${esc(a.title)}</div>
                <div class="text-sm muted mt-2" style="margin-top:4px;line-height:1.5;">${esc(a.content)}</div>
                <div class="text-xs subtle mt-2">${fmtShortDate(a.created_at)}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="h3">Cara pakai</div></div>
          <ol style="padding:16px 16px 16px 32px;font-size:13px;color:var(--text-2);line-height:1.7;">
            <li>Buka channel WhatsApp Anda.</li>
            <li>Salin link channel.</li>
            <li>Tempel di kolom, isi emoji.</li>
            <li>Klik Kirim request.</li>
            <li>Pantau status di Riwayat.</li>
          </ol>
        </div>
      </aside>
    </div>
  `;

  publicShell(content);
  $('#request-form')?.addEventListener('submit', onSubmitRequest);
}

async function onSubmitRequest(e) {
  e.preventDefault();
  const urlErr = $('#f-url-err');
  const emojiErr = $('#f-emoji-err');
  urlErr.style.display = 'none';
  emojiErr.style.display = 'none';

  if (isBlacklisted()) return toast('Akun diblokir.', 'error');
  if (state.settings.maintenance_mode) return toast('Mode maintenance aktif.', 'error');
  if (!state.settings.service_enabled) return toast('Layanan dinonaktifkan.', 'error');

  const channelUrl = $('#f-url').value.trim();
  if (!isValidChannelUrl(channelUrl)) {
    urlErr.textContent = 'Link tidak valid. Gunakan format whatsapp.com/channel/…';
    urlErr.style.display = 'block';
    return;
  }

  const parsed = parseEmojis($('#f-emoji').value, state.settings.max_emojis);
  if (parsed.error) {
    emojiErr.textContent = parsed.error;
    emojiErr.style.display = 'block';
    return;
  }

  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  if (l.request_count >= max) return toast('Limit harian habis.', 'error');

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Memproses...'; }

  try {
    const result = await callRealAPI({
      channel_url: channelUrl,
      emojis: parsed.emojis.join(',')
    });

    if (result.success) {
      toast('Reaction berhasil dikirim!', 'success');
      $('#f-url').value = ''; 
      $('#f-emoji').value = '';
    } else {
      toast(`Gagal: ${result.error}`, 'error');
    }
  } catch (err) {
    toast('Terjadi kesalahan jaringan.', 'error');
  } finally {
    // MENGEMBALIKAN TOMBOL KE NORMAL
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${I.zap} Kirim request`; }
    await syncWithDatabase();
    renderHome(); 
  }
}