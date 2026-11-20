// (Bagian atas overview.js biarkan sama)
      <div class="card">
        <div class="card-header"><div class="h3">Aksi cepat</div></div>
        <div class="card-body stack gap-2">
          <!-- PERBAIKAN: Ubah location.hash menjadi fungsi pindah tab admin -->
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('settings')" style="justify-content:flex-start;">${I.settings} Ubah pengaturan</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('requests')" style="justify-content:flex-start;">${I.list} Lihat semua request</button>
          <button class="btn btn-secondary btn-block" onclick="window.switchAdminTab('announcements')" style="justify-content:flex-start;">${I.megaphone} Kelola pengumuman</button>
          <button class="btn btn-secondary btn-block" onclick="window.exportAllCSV()" style="justify-content:flex-start;">${I.download} Export data CSV</button>
        </div>
      </div>
    </div>`;
}

// TAMBAHKAN FUNGSI INI DI PALING BAWAH FILE overview.js
window.switchAdminTab = (tabName) => {
  import('../state.js').then(({ state }) => {
    state.admin.tab = tabName;
    import('./dashboard.js').then(({ rerenderAdmin }) => {
      rerenderAdmin();
    });
  });
};