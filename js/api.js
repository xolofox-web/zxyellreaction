import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  // FIX: Menambah timeout dari 6 detik menjadi 15 detik (15000ms) 
  // untuk mengakomodasi Vercel Serverless Cold Start atau koneksi lambat.
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
    const textData = await res.text(); 
    
    let data;
    try {
      data = JSON.parse(textData); 
    } catch (e) {
      const errorMsg = `Server Error: Respon tidak valid (Bukan JSON).`; 
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

    if (!res.ok) {
      logApi('reactch', 'failed', ms, data.error || `HTTP ${res.status}`, res.status);
      return { success: false, error: data.error || `HTTP Error ${res.status}` };
    }

    logApi('reactch', 'success', ms, null, res.status);
    return { success: true };

  } catch (err) {
    clearTimeout(timeoutId);
    const ms = Math.round(performance.now() - start);
    // FIX: Pesan error timeout diperjelas
    const msg = err.name === 'AbortError' ? 'Waktu habis: Server terlalu lambat atau sedang Cold Start.' : err.message;
    logApi('reactch', 'failed', ms, msg, 0);
    return { success: false, error: msg };
  }
}