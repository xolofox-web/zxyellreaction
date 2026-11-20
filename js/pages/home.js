import { state, ensureLimit, isBlacklisted, syncWithDatabase } from '../state.js';
import { publicShell } from '../components/shell.js';
import { isValidChannelUrl, parseEmojis } from '../validation.js';
import { fmtTime, fmtShortDate, esc, $, toast } from '../utils.js';
import { I } from '../icons.js';
import { callRealAPI } from '../api.js';

export function renderHome() {
  const prevUrl = $('#f-url')?.value || '';
  const prevEmoji = $('#f-emoji')?.value || '';

  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  const remaining = Math.max(0, max - l.request_count);
  const announcements = state.announcements.filter(a => a.status === 'published');
  
  // Pastikan menggunakan device_id sesuai database
  const userReqs = state.requests.filter(r => r.device_id === state.userId);
  const stats = {
    total: userReqs.length,
    success: userReqs.filter(r => r.status === 'success').length,
    failed: userReqs.filter(r => r.status === 'failed').length,
  };
  
  const disabled = state.settings.maintenance_mode || !state.settings.service_enabled || isBlacklisted() || remaining <= 0;
  const progressPct = Math.min(100, (remaining / max) * 100);

  const content = `
    <header class="mb-8">
      <h1 class="h1">Kirim reaction ke<br/>channel WhatsApp</h1>
      <p class="muted mt-2" style="font-size:15px;max-width:480px;">Tempel link channel, pilih emoji, dan biarkan sistem memproses otomatis.</p>
    </header>

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
              </div>
              <div class="field">
                <label class="label">Emoji <span class="subtle">— pisahkan dengan koma</span></label>
                <input id="f-emoji" class="input" type="text" placeholder="❤️,🔥,😍" ${disabled ? 'disabled' : ''} autocomplete="off" value="${esc(prevEmoji)}" />
                <div id="f-emoji-err" class="error-text" style="display:none;"></div>
              </div>
              <div class="row gap-3" style="flex-wrap:wrap;">
                <button type="submit" class="btn btn-wa" ${disabled ? 'disabled' : ''} style="height:38px;padding:0 18px;">${I.zap} Kirim request</button>
                <span class="text-sm subtle" style="margin-left:auto;">Reset dalam <span data-countdown class="mono">${fmtTime(l.reset_at - Date.now())}</span></span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <aside class="stack gap-4">
        <div class="card">
          <div class="card-header"><div class="h3">Pengumuman</div></div>
          <div style="padding:8px;">
            ${announcements.length === 0 ? `<div class="empty">Belum ada pengumuman</div>` : announcements.map(a => `
              <div style="padding:12px;border-radius:var(--radius);">
                <div class="h3" style="font-size:13.5px;">${esc(a.title)}</div>
                <div class="text-sm muted mt-2">${esc(a.content)}</div>
              </div>`).join('')}
          </div>
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
    urlErr.textContent = 'Link tidak valid.'; urlErr.style.display = 'block'; return;
  }

  const parsed = parseEmojis($('#f-emoji').value, state.settings.max_emojis);
  if (parsed.error) {
    emojiErr.textContent = parsed.error; emojiErr.style.display = 'block'; return;
  }

  // Cek limit lokal sebelum kirim
  const l = ensureLimit();
  const max = state.settings.daily_limit + (l.bonus || 0);
  if (l.request_count >= max) return toast('Limit harian habis.', 'error');

  // Cek duplikat (30 detik)
  const recent = state.requests.find(r =>
    r.device_id === state.userId &&
    r.channel_url === channelUrl &&
    r.emojis === parsed.emojis.join(',') &&
    Date.now() - new Date(r.created_at).getTime() < 30000
  );
  if (recent) return toast('Request duplikat. Tunggu 30 detik.', 'error');

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Memproses...'; }

  try {
    const result = await callRealAPI({
      channel_url: channelUrl,
      emojis: parsed.emojis.join(',')
    });

    if (result.success) {
      // 1. Tampilkan Notifikasi
      if (result.message && (result.message.includes('lama') || result.message.includes('Timeout'))) {
        toast(result.message, 'warning'); 
      } else {
        toast('Reaction berhasil dikirim!', 'success');
      }
      
      // 2. OPTIMISTIC UPDATE: Update UI Lokal secara instan
      // Agar limit langsung berkurang di layar tanpa nunggu sinkronisasi database
      l.request_count++; 
      
      // Tambahkan data ke riwayat lokal agar langsung muncul di halaman "Riwayat"
      state.requests.unshift({
        id: 'req_' + Date.now(), // ID sementara
        device_id: state.userId,
        channel_url: channelUrl,
        emojis: parsed.emojis.join(','),
        status: 'success',
        created_at: new Date().toISOString(),
        error_message: result.message || null
      });

      // 3. Kosongkan form
      $('#f-url').value = ''; 
      $('#f-emoji').value = '';
      
      // 4. Sinkronisasi dengan database di latar belakang (untuk memastikan data valid)
      if (typeof syncWithDatabase === 'function') {
        syncWithDatabase().catch(console.error); // Jalankan tanpa 'await' agar UI tidak menunggu
      }

    } else {
      toast(`Gagal: ${result.error}`, 'error');
    }
  } catch (err) {
    console.error(err);
    toast('Terjadi kesalahan sistem.', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${I.zap} Kirim request`; }
    renderHome(); // Render ulang UI dengan data terbaru
  }
}