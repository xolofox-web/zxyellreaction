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
            <!-- FIX MUTLAK: Tag <form> dihapus, diganti <div> -->
            <div id="request-form" class="stack gap-5">
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
                <!-- FIX MUTLAK: Tombol diubah jadi type="button" dengan id -->
                <button type="button" id="btn-submit-req" class="btn btn-wa" ${disabled ? 'disabled' : ''} style="height:38px;padding:0 18px;">${I.zap} Kirim request</button>
                <span class="text-sm subtle" style="margin-left:auto;">Reset dalam <span data-countdown class="mono">${fmtTime(l.reset_at - Date.now())}</span></span>
              </div>
            </div>
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

    <!-- ======================================================== -->
    <!-- TOMBOL SOSIAL MEDIA                                      -->
    <!-- ======================================================== -->
    <div class="social-links-container">
      <a href="https://t.me/Zyxellvar" target="_blank" rel="noopener noreferrer" class="social-btn tg-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span>Telegram</span>
      </a>

      <a href="https://www.instagram.com/zyxellvar?lqvp=cW1iMnZoY2cxa2Ix" target="_blank" rel="noopener noreferrer" class="social-btn ig-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
        <span>Instagram</span>
      </a>

      <a href="https://www.tiktok.com/@zyxellvar?_r=1&_t=ZS-9BaZ2Fr6A6i" target="_blank" rel="noopener noreferrer" class="social-btn tt-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
        </svg>
        <span>TikTok</span>
      </a>
    </div>
  `;
  
  publicShell(content);
  
  // FIX: Event listener sekarang menggunakan 'click', bukan 'submit'
  $('#btn-submit-req')?.addEventListener('click', onSubmitRequest);
}

async function onSubmitRequest(e) {
  // e.preventDefault() tidak lagi terlalu dibutuhkan karena bukan form,
  // tapi tetap dibiarkan sebagai pengaman.
  if (e) e.preventDefault(); 
  
  if (isBlacklisted()) return toast('Akun diblokir.', 'error');
  if (state.settings.maintenance_mode) return toast('Mode maintenance aktif.', 'error');
  if (!state.settings.service_enabled) return toast('Layanan dinonaktifkan.', 'error');

  const channelUrl = $('#f-url').value.trim();
  const urlErr = $('#f-url-err');
  if (!isValidChannelUrl(channelUrl)) {
    if(urlErr) { urlErr.textContent = 'Link tidak valid.'; urlErr.style.display = 'block'; }
    return;
  }

  const parsed = parseEmojis($('#f-emoji').value, state.settings.max_emojis);
  const emojiErr = $('#f-emoji-err');
  if (parsed.error) {
    if(emojiErr) { emojiErr.textContent = parsed.error; emojiErr.style.display = 'block'; }
    return;
  }

  if(urlErr) urlErr.style.display = 'none';
  if(emojiErr) emojiErr.style.display = 'none';

  const submitBtn = $('#btn-submit-req');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Memproses...'; }

  try {
    const result = await callRealAPI({
      channel_url: channelUrl,
      emojis: parsed.emojis.join(',')
    });

    if (result.success) {
      if (result.message && (result.message.includes('lama') || result.message.includes('Timeout'))) {
        toast(result.message, 'warning'); 
      } else {
        toast('Reaction berhasil dikirim!', 'success');
      }
      
      const l = ensureLimit();
      l.request_count++; 
      state.requests.unshift({
        id: 'req_' + Date.now(), 
        device_id: state.userId, 
        channel_url: channelUrl,
        emojis: parsed.emojis.join(','),
        status: 'success',
        created_at: new Date().toISOString(),
        error_message: result.message || null
      });

      $('#f-url').value = ''; 
      $('#f-emoji').value = '';
      
      setTimeout(async () => {
        if (typeof syncWithDatabase === 'function') {
           await syncWithDatabase();
           renderHome(); 
        }
      }, 2000);

    } else {
      toast(`Gagal: ${result.error}`, 'error');
    }
  } catch (err) {
    console.error(err);
    toast('Terjadi kesalahan sistem.', 'error');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${I.zap} Kirim request`; }
  }
}
