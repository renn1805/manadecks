// Screen routing (no URL hash, so it also works from file://) and the standalone search screen.
(function () {
  const MD = (window.MD = window.MD || {});
  const h = MD.h;
  let state = { view: 'home', deckId: null };
  let searchSeq = 0;

  function renderSearch(root) {
    const result = h('div', { class: 'search-result' });
    const box = MD.searchBox('Pesquisar carta pelo nome (em português)', async function (term) {
      const my = ++searchSeq;
      box.setBusy(true);
      MD.clear(result).append(MD.status('loading', 'Buscando na Scryfall…'));
      try {
        const card = await MD.scryfall.searchByName(term);
        if (my === searchSeq) MD.clear(result).append(MD.cards.renderDetail(card));
      } catch (err) {
        if (my === searchSeq) MD.clear(result).append(MD.status(err.kind === 'notfound' ? 'empty' : 'error', err.message));
      } finally {
        if (my === searchSeq) box.setBusy(false);
      }
    });
    root.append(
      h('header', { class: 'page-head' }, h('div', {}, h('h1', { text: 'Pesquisar cartas' }),
        h('p', { class: 'muted', text: 'Consulte qualquer carta sem adicioná-la a um deck.' }))),
      box.el,
      result);
    box.input.focus();
  }

  function refresh() {
    const active = state.view === 'deck' ? 'home' : state.view;
    document.querySelectorAll('.nav-item[data-view]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === active);
    });
    const root = MD.clear(document.getElementById('view'));
    if (state.view === 'deck') MD.decks.renderDeck(root, state.deckId);
    else if (state.view === 'search') renderSearch(root);
    else MD.decks.renderHome(root);
  }

  function show(view, deckId) {
    state = { view: view, deckId: deckId || null };
    refresh();
    window.scrollTo(0, 0);
  }

  MD.nav = { show: show, refresh: refresh };
})();
