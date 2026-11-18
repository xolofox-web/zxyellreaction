import { logApi } from './state.js';

export async function callRealAPI(req) {
  const deviceId = localStorage.getItem('wacr_user_id') || 'user_default';
  const start = performance.now();

  try {
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

    logApi('reactch', 'success', ms, null, res.status);
    return { success: true };

  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logApi('reactch', 'failed', ms, err.message, 0);
    return { success: false, error: `Network: ${err.message}` };
  }
}