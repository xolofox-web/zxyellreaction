import { initTheme } from './theme.js';
import { state, initState } from './state.js';
import { renderAdmin } from './admin/dashboard.js';
import { renderAdminLogin } from './pages/login.js';
import { I } from './icons.js';

initTheme();
initState();

function renderAdminApp() {
  // Cek apakah admin sudah login
  if (!state.isAdmin) {
    // Tampilkan halaman login
    document.getElementById('admin-app').innerHTML = '';
    renderAdminLogin('admin-app'); // Kita arahkan target ke id="admin-app"
  } else {
    // Tampilkan dashboard admin
    document.getElementById('admin-app').innerHTML = '';
    renderAdmin('admin-app');
  }
}

renderAdminApp();