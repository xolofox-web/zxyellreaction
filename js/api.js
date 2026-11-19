import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  try {
    // Memanggil endpoint backend Vercel yang baru
    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: req.channel_url,
        emojis: req.emojis,
        deviceId: deviceId
      })
    });

    const ms = Math.round(performance.now() - start);
    const data = await res.json();

    if (!res.ok) {
      logApi('reactch', 'failed', ms, data.error || `HTTP ${res.status}`, res.status);
      return { success: false, error: data.error || `HTTP Error ${res.status}` };
    }

    if (data.status === true) {
      logApi('reactch', 'success', ms, null, res.status);
      return { success: true };
    } else {
      const errorMsg = data.error || data.message || 'API menolak request.';
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }

  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logApi('reactch', 'failed', ms, err.message, 0);
    return { success: false, error: `Network/CORS: ${err.message}` };
  }
}