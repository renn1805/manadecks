// LocalStorage persistence. One key holds the whole app state.
(function () {
  const MD = (window.MD = window.MD || {});
  const KEY = 'manadeck:data';

  function empty() {
    return { version: 1, decks: [], settings: { theme: 'light' } };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.decks)) {
          d.version = 1;
          d.settings = d.settings || { theme: 'light' };
          return d;
        }
      }
    } catch (e) { /* corrupted or unavailable storage: start empty */ }
    return empty();
  }

  let data = load();

  MD.storage = {
    get: function () { return data; },
    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {
        if (MD.toast) MD.toast('Não foi possível salvar os dados neste navegador.', 'error');
      }
    },
    replace: function (next) {
      data = next;
      MD.storage.save();
    }
  };
})();
