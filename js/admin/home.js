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
  
  const userReqs = state.requests.filter(r => r.device_id === state.userId);
  const stats = {
    total: userReqs.length,
    success: userReqs.filter(r => r.status === 'success').length,
    failed: userReqs.filter(r => r.status === 'failed').length,
  };
  
  const disabled = state.settings.maintenance_mode || !state.settings.service_enabled || isBlacklisted() || remaining <= 0;

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
    </div>
  `;
  publicShell(content);
  $('#request-form')?.addEventListener('submit', onSubmitRequest);
}

async function onSubmitRequest(e) {
  e.preventDefault();
  if (isBlacklisted()) return toast('Akun diblokir.', 'error');
  
  const channelUrl = $('#f-url').value.trim();
  const parsed = parseEmojis($('#f-emoji').value, state.settings.max_emojis);
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Memproses...'; }

  try {
    const result = await callRealAPI({
      channel_url: channelUrl,
      emojis: parsed.emojis.join(',')
    });

    if (result.success) {
      toast(result.message || 'Reaction berhasil dikirim!', 'success');
      
      // Optimistic Update Lokal agar UI langsung berubah
      const l = ensureLimit();
      l.request_count++; 
      state.requests.unshift({
        id: 'req_' + Date.now(), 
        device_id: state.userId, // Pastikan ID ini sama
        channel_url: channelUrl,
        emojis: parsed.emojis.join(','),
        status: 'success',
        created_at: new Date().toISOString(),
        error_message: result.message || null
      });

      $('#f-url').value = ''; 
      $('#f-emoji').value = '';
      
      // Sinkronisasi paksa setelah 2 detik agar data dari Vercel masuk ke Supabase
      setTimeout(async () => {
        if (typeof syncWithDatabase === 'function') {
           await syncWithDatabase();
           renderHome(); // Render ulang setelah data sync masuk
        }
      }, 2000);

    } else {
      toast(`Gagal: ${result.error}`, 'error');
    }
  } catch (err) {
    toast('Terjadi kesalahan sistem.', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${I.zap} Kirim request`; }
    renderHome(); 
  }
}