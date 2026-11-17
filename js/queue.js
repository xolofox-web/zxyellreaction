import { state, saveRequests } from './state.js';
import { callRealAPI } from './api.js';
import { sleep, toast, shortId } from './utils.js';

let processing = false;
const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
}

export async function processQueue() {
  if (processing) return;
  const pending = state.requests.filter(r => r.status === 'pending');
  if (!pending.length) return;
  processing = true;

  try {
    for (const req of pending.slice(0, 3)) {
      req.status = 'processing';
      saveRequests();
      notify();

      await sleep(state.settings.simulation_mode ? 1200 + Math.random() * 1500 : 200);

      let result;
      if (state.settings.simulation_mode) {
        await sleep(600);
        result = Math.random() > 0.15
          ? { success: true }
          : { success: false, error: 'Simulasi: API tidak merespons.' };
      } else {
        result = await callRealAPI(req);
      }

      if (result.success) {
        req.status = 'success';
        req.error_message = null;
        req.completed_at = Date.now();
      } else {
        const rc = (req.retry_count || 0) + 1;
        const canRetry = state.settings.auto_retry && rc < state.settings.max_retries;
        req.retry_count = rc;
        req.error_message = result.error || 'Unknown error';
        if (canRetry) { req.status = 'pending'; req.completed_at = null; }
        else { req.status = 'failed'; req.completed_at = Date.now(); }
      }
      saveRequests();
      toast(
        `Request ${shortId(req.id)}: ${req.status === 'success' ? 'berhasil' : req.status === 'failed' ? 'gagal' : 'retry'}`,
        req.status === 'success' ? 'success' : req.status === 'failed' ? 'error' : 'info'
      );
      notify();
      await sleep(200);
    }
  } finally {
    processing = false;
  }
}