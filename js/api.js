import { API_BASE, API_KEY } from './config.js';
import { logApi } from './state.js';

export async function callRealAPI(req) {
  const url = `${API_BASE}?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(req.channel_url)}&emoji=${encodeURIComponent(req.emojis)}`;
  const start = performance.now();

  try {
    const res = await fetch(url);
    const ms = Math.round(performance.now() - start);
    const data = await res.json();

    if (!res.ok) {
      logApi('reactch', 'failed', ms, `HTTP ${res.status}`, res.status);
      return { success: false, error: `HTTP Error ${res.status}` };
    }

    // Cek respon asli API apikayz (status: true / false)
    if (data.status === true) {
      logApi('reactch', 'success', ms, null, res.status);
      return { success: true };
    } else {
      // Jika status false, ambil pesan dari properti "error"
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