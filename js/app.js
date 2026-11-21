// App bootstrap: theme, sidebar wiring, first screen.
(function () {
  const MD = window.MD;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('btn-theme').textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  }

  function init() {
    const data = MD.storage.get();
    applyTheme(data.settings.theme === 'dark' ? 'dark' : 'light');

    document.querySelectorAll('.nav-item[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { MD.nav.show(b.dataset.view); });
    });

    document.getElementById('btn-theme').addEventListener('click', function () {
      const next = MD.storage.get().settings.theme === 'dark' ? 'light' : 'dark';
      MD.storage.get().settings.theme = next;
      MD.storage.save();
      applyTheme(next);
    });

    document.getElementById('btn-export').addEventListener('click', MD.backup.exportData);
    const file = document.getElementById('file-import');
    document.getElementById('btn-import').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      if (file.files[0]) MD.backup.importFile(file.files[0]);
      file.value = '';
    });

    MD.nav.show('home');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
