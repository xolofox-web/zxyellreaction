import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // Frontend timeout lebih lama dari backend

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
    const textData = await res.text(); 
    
    let data = {};
    try {
      if (textData) data = JSON.parse(textData); 
    } catch (e) {
      const errorMsg = res.status === 504 
        ? 'Server Timeout (Vercel Limit).' 
        : 'Server Error: Respon tidak valid (Bukan JSON).';
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    // FIX: Cek HTTP Status DAN cek status di dalam JSON
    if (!res.ok || data.success === false || data.status === false) {
      const errorMsg = data.error || data.message || `HTTP Error ${res.status}`;
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    logApi('reactch', 'success', ms, null, res.status);
    return { success: true };

  } catch (err) {
    clearTimeout(timeoutId);
    const ms = Math.round(performance.now() - start);
    
    let msg = err.message;
    if (err.name === 'AbortError') {
      msg = 'Waktu habis (Frontend Timeout).';
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Gagal terhubung ke server (Cek koneksi).';
    }

    logApi('reactch', 'failed', ms, msg, 0);
    return { success: false, error: msg };
  }
}