import { state } from '../state.js';
import { publicShell } from '../components/shell.js';
import { esc } from '../utils.js';
import { I } from '../icons.js';

export function renderMaintenance() {
  publicShell(`
    <div style="max-width:440px;margin:60px auto;text-align:center;">
      <div style="width:56px;height:56px;background:var(--surface-2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-2);margin-bottom:20px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.8-.7-.7-2.8z"/></svg>
      </div>
      <h1 class="h1" style="font-size:22px;">Sedang maintenance</h1>
      <p class="muted mt-2" style="font-size:14px;line-height:1.6;">${esc(state.settings.maintenance_message)}</p>
      ${state.isAdmin ? `<a href="#/admin" class="btn btn-secondary mt-6" style="display:inline-flex;">Buka Admin Dashboard ${I.arrowRight}</a>` : ''}
    </div>
  `);
}