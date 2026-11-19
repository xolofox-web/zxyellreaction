// (Bagian atas home.js tetap sama, import dan renderHome...)

async function onSubmitRequest(e) {
  e.preventDefault();
  const urlErr = $('#f-url-err');
  const emojiErr = $('#f-emoji-err');
  urlErr.style.display = 'none';
  emojiErr.style.display = 'none';

  if (isBlacklisted()) return toast('Akun diblokir.', 'error');
  if (state.settings.maintenance_mode) return toast('Mode maintenance aktif.', 'error');

  const channelUrl = $('#f-url').value.trim();
  if (!isValidChannelUrl(channelUrl)) {
    urlErr.textContent = 'Link tidak valid.'; urlErr.style.display = 'block'; return;
  }

  const parsed = parseEmojis($('#f-emoji').value, state.settings.max_emojis);
  if (parsed.error) {
    emojiErr.textContent = parsed.error; emojiErr.style.display = 'block'; return;
  }

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
    toast('Terjadi kesalahan sistem.', 'error');
  } finally {
    // 1. KEMBALIKAN TOMBOL KE NORMAL SECARA INSTAN
    if (submitBtn) { 
      submitBtn.disabled = false; 
      submitBtn.innerHTML = `${I.zap} Kirim request`; 
    }
    
    // 2. Tampilkan data lama dulu
    renderHome(); 

    // 3. Tarik data terbaru dari Supabase
    await syncWithDatabase();
    renderHome(); 
  }
}