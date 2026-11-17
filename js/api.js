import { API_BASE, API_KEY } from './config.js';
import { logApi } from './state.js';

export async function callRealAPI(req) {
  const url = `${API_BASE}?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(req.channel_url)}&emoji=${encodeURIComponent(req.emojis)}`;
  const start = performance.now();

  try {
    const res = await fetch(url);
    const ms = Math.round(performance.now() - start);
    const textData = await res.text(); // Ambil respon sebagai teks dulu

    let data = {};
    try {
      data = JSON.parse(textData); // Coba ubah ke JSON
    } catch (e) {
      // Jika gagal di-parse, berarti respon bukan JSON (kemungkinan HTML error)
      console.error('[API] Respon bukan JSON:', textData);
      logApi('reactch', 'failed', ms, 'Respon API bukan JSON', res.status);
      return { success: false, error: 'Respon API tidak valid (bukan JSON).' };
    }

    // --- DEBUGGING: Cek Console Browser (F12) untuk melihat respon asli ---
    console.log('[API] Respon asli dari apikayz:', data);

    if (!res.ok) {
      logApi('reactch', 'failed', ms, `HTTP ${res.status}`, res.status);
      return { success: false, error: `HTTP Error ${res.status}: ${data.message || 'Unknown'}` };
    }

    // --- PERKETAT PENGECEKAN SUKSES ---
    // Kita hanya menganggap sukses JIKA API secara eksplisit mengatakannya.
    const isSuccess = 
      data.status === true || 
      data.status === 'success' || 
      data.success === true || 
      data.ok === true ||
      data.result === true;

    if (isSuccess) {
      logApi('reactch', 'success', ms, null, res.status);
      return { success: true };
    } else {
      // Jika API tidak bilang sukses, kita anggap GAGAL.
      const errorMsg = data.message || data.error || data.msg || 'API tidak memberikan status sukses.';
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logApi('reactch', 'failed', ms, err.message, 0);
    return { success: false, error: `Network Error: ${err.message}. (Cek koneksi atau CORS)` };
  }
}