import { initTheme } from './theme.js';
import { state, initState } from './state.js';
import { renderHome } from './pages/home.js';

initTheme();
initState();

// Tampilkan Halaman Depan
try {
  renderHome();
} catch (error) {
  document.getElementById('app').innerHTML = `
    <div style="padding:20px; font-family:sans-serif; background:#fee; color:#900; border:2px solid red; margin:20px;">
      <h3>Error di Home.js</h3>
      <p>${error.message}</p>
    </div>
  `;
}