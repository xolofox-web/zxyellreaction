import { STORAGE_PREFIX } from './config.js';
import { I } from './icons.js';

export const DB = {
  get(k, fb) {
    try {
      const v = localStorage.getItem(STORAGE_PREFIX + k);
      return v == null ? fb : JSON.parse(v);
    } catch { return fb; }
  },
  set(k, v) {
    try { localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)); }
    catch (e) { console.warn(e); }
  },
};

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export const fmtDate = (ts) => ts ? new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const fmtShortDate = (ts) => ts ? new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—';
export const fmtTime = (ms) => {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
};
export const shortId = (s) => String(s || '').slice(-8);

export function toast(msg, kind = 'info', ms = 3200) {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  const colorVar = kind === 'success' ? 'success' : kind === 'error' ? 'error' : 'info';
  const ic = kind === 'success' ? I.check : kind === 'error' ? I.alert : I.info;
  el.innerHTML = `<span style="color:var(--${colorVar});flex-shrink:0;margin-top:1px;">${ic}</span><span style="flex:1;">${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, ms);
}