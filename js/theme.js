import { I } from './icons.js';

export function initTheme() {
  const stored = localStorage.getItem('wacr_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('wacr_theme', next);
  const btn = document.querySelector('[data-theme-toggle]');
  if (btn) btn.innerHTML = next === 'dark' ? I.sun : I.moon;
}

window.toggleTheme = toggleTheme;