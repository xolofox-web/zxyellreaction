import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  // Timeout diset 15 detik. 
  // Catatan: Jika backend Vercel Anda kena limit 10 detik (Hobby plan), 
  // Vercel akan memutus paksa di 10 detik dengan status 504.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: req.channel_url,
        emojis: req.emojis,
        deviceId: deviceId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const ms = Math.round(performance.now() - start);
    
    // Ambil response sebagai teks terlebih dahulu
    const textData = await res.text(); 
    
    let data = {};
    // Coba parsing JSON (bisa gagal jika Vercel mengembalikan halaman HTML 504)
    try {
      if (textData) data = JSON.parse(textData); 
    } catch (e) {
      // Jika parsing gagal (biasanya karena error 504 dari Vercel yang berisi HTML)
      const errorMsg = res.status === 504 
        ? 'Server Timeout (Vercel Limit). API eksternal terlalu lama merespons.' 
        : 'Server Error: Respon tidak valid (Bukan JSON).';
        
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    // FIX 1: Periksa apakah HTTP status tidak OK (400, 500, 504, dll)
    if (!res.ok) {
      const errorMsg = data.error || data.message || `HTTP Error ${res.status}`;
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    // FIX 2: Periksa apakah Backend mengembalikan status GAGAL meskipun HTTP 200
    // (Ini mengatasi masalah "Notif berhasil tapi reaction tidak masuk")
    const isBackendSuccess = data.success === true || data.status === 'success';
    const isBackendFailed = data.success === false || data.status === 'failed' || data.error;

    if (isBackendFailed) {
      const errorMsg = data.error || data.message || 'Backend melaporkan kegagalan tanpa pesan.';
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    // Jika tidak ada indikator gagal dan HTTP 200, anggap sukses
    // (Tapi jika backend Anda tidak mengirim "success: true", kita asumsikan sukses jika tidak ada error)
    logApi('reactch', 'success', ms, null, res.status);
    return { success: true };

  } catch (err) {
    clearTimeout(timeoutId);
    const ms = Math.round(performance.now() - start);
    
    let msg = err.message;
    if (err.name === 'AbortError') {
      msg = 'Waktu habis (Frontend Timeout 15s). Koneksi terputus.';
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Gagal terhubung ke server. Periksa koneksi internet atau server mati.';
    }

    logApi('reactch', 'failed', ms, msg, 0);
    return { success: false, error: msg };
  }
}