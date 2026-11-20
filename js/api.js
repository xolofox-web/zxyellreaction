import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  // Timeout dipercepat jadi 6 detik
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

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
      const errorMsg = `Server Error: Respon tidak valid.`; 
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
    const msg = err.name === 'AbortError' ? 'Waktu habis (Server lambat).' : err.message;
    logApi('reactch', 'failed', ms, msg, 0);
    return { success: false, error: msg };
  }
}