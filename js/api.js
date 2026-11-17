import { logApi } from './state.js';

export async function callRealAPI(req) {
  // Memanggil API internal Vercel kita, bukan langsung ke apikayz
  const url = `/api/react?url=${encodeURIComponent(req.channel_url)}&emoji=${encodeURIComponent(req.emojis)}`;
  const start = performance.now();

  try {
    const res = await fetch(url);
    const ms = Math.round(performance.now() - start);
    const data = await res.json();

    if (!res.ok) {
      logApi('reactch', 'failed', ms, `HTTP ${res.status}`, res.status);
      return { success: false, error: `HTTP Error ${res.status}` };
    }

    // Cek ketat status sukses
    const isSuccess = data.status === true || data.status === 'success' || data.success === true;
    
    if (isSuccess) {
      logApi('reactch', 'success', ms, null, res.status);
      return { success: true };
    } else {
      const errorMsg = data.message || data.error || data.msg || 'API menolak request.';
      logApi('reactch', 'failed', ms, errorMsg, res.status);
      return { success: false, error: errorMsg };
    }
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    logApi('reactch', 'failed', ms, err.message, 0);
    return { success: false, error: `Network: ${err.message}` };
  }
}