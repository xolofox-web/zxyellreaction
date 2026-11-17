import { API_BASE, API_KEY } from './config.js';
import { logApi } from './state.js';

export async function callRealAPI(req) {
  const url = `${API_BASE}?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(req.channel_url)}&emoji=${encodeURIComponent(req.emojis)}`;
  const start = performance.now();
  try {
    const res = await fetch(url);
    const ms = Math.round(performance.now() - start);
    if (!res.ok) {
      logApi('reactch', 'failed', ms, `HTTP ${res.status}`, res.status);
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    logApi('reactch', 'success', ms, null, res.status);
    const ok = data?.success === true || data?.status === 'success' || data?.ok === true;
    return ok ? { success: true } : { success: false, error: data?.message || data?.error || 'Respon tidak dikenali.' };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logApi('reactch', 'failed', ms, err.message, 0);
    return { success: false, error: `Network: ${err.message}. Aktifkan Simulation Mode di Settings.` };
  }
}