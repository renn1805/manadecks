// Home screen (deck carousel), deck creation/deletion and the deck page.
(function () {
  const MD = (window.MD = window.MD || {});
  const h = MD.h;

  const FORMATS = ['Commander', 'Standard', 'Modern', 'Legacy', 'Vintage', 'Pioneer', 'Pauper', 'Outros'];
  const COLORS = ['W', 'U', 'B', 'R', 'G'];

  const STATUS_FILTERS = [['all', 'Qualquer status']].concat(MD.cards.STATUSES);
  const BADGE = { owned: 'Tenho', missing: 'Falta', buy: 'A comprar' };
  let deckFilter = 'all';
  let ownFilter = 'all';
  let searchSeq = 0;

  function newId() {
    return 'deck-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function totalCards(deck) {
    return deck.cards.reduce(function (n, c) { return n + c.quantity; }, 0);
  }

  function deleteDeck(id) {
    const data = MD.storage.get();
    const deck = data.decks.find(function (d) { return d.id === id; });
    if (!deck) return;
    if (!confirm('Excluir o deck "' + deck.name + '"? Essa ação não pode ser desfeita.')) return;
    data.decks = data.decks.filter(function (d) { return d.id !== id; });
    MD.storage.save();
    MD.toast('Deck excluído.');
    MD.nav.show('home');
  }

  function closeModal() {
    const m = document.querySelector('.modal-overlay');
    if (m) m.remove();
    document.removeEventListener('keydown', onEsc);
  }
  function onEsc(e) { if (e.key === 'Escape') closeModal(); }

  function openCreateModal() {
    const name = h('input', { class: 'input', type: 'text', maxlength: '80' });
    const url = h('input', { class: 'input', type: 'text', placeholder: 'https://www.ligamagic.com.br/...' });
    const format = h('select', { class: 'input' }, FORMATS.map(function (f) { return h('option', { value: f, text: f }); }));
    const other = h('input', { class: 'input', type: 'text', placeholder: 'Nome do formato (opcional)', hidden: true });
    const desc = h('textarea', { class: 'input', rows: '3', maxlength: '500' });
    const error = h('div', { class: 'form-error' });

    format.addEventListener('change', function () { other.hidden = format.value !== 'Outros'; });

    const colorInputs = COLORS.map(function (c) {
      const box = h('input', { type: 'checkbox', value: c });
      return { c: c, box: box, el: h('label', { class: 'color-opt' }, box, MD.colorPips([c]), MD.COLOR_NAMES[c]) };
    });

    function submit() {
      const n = name.value.trim();
      if (!n) { error.textContent = 'Informe o nome do deck.'; name.focus(); return; }
      const link = url.value.trim();
      if (link && !/^https?:\/\/\S+$/i.test(link)) {
        error.textContent = 'O link da Liga Magic deve começar com http:// ou https://.';
        url.focus();
        return;
      }
      const fmt = format.value === 'Outros' ? (other.value.trim() || 'Outros') : format.value;
      const deck = {
        id: newId(),
        name: n,
        leagueUrl: link,
        format: fmt,
        colors: colorInputs.filter(function (x) { return x.box.checked; }).map(function (x) { return x.c; }),
        description: desc.value.trim(),
        cards: []
      };
      MD.storage.get().decks.push(deck);
      MD.storage.save();
      closeModal();
      MD.toast('Deck criado.');
      MD.nav.show('deck', deck.id);
    }

    const modal = h('div', { class: 'modal-overlay', onclick: function (e) { if (e.target === e.currentTarget) closeModal(); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
        h('h2', { text: 'Novo deck' }),
        h('label', { class: 'field' }, h('span', { text: 'Nome *' }), name),
        h('label', { class: 'field' }, h('span', { text: 'Formato *' }), format, other),
        h('div', { class: 'field' }, h('span', { text: 'Identidade de cor' }),
          h('div', { class: 'color-opts' }, colorInputs.map(function (x) { return x.el; }))),
        h('label', { class: 'field' }, h('span', { text: 'Link da Liga Magic' }), url),
        h('label', { class: 'field' }, h('span', { text: 'Descrição' }), desc),
        error,
        h('div', { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn', text: 'Cancelar', onclick: closeModal }),
          h('button', { type: 'button', class: 'btn btn-primary', text: 'Criar deck', onclick: submit }))));
    document.body.append(modal);
    document.addEventListener('keydown', onEsc);
    name.focus();
  }

  // ---------- Home ----------

  function deckCard(deck) {
    const first = deck.cards[0];
    const cover = first && (first.artUrl || first.imageUrl);
    const n = totalCards(deck);
    return h('article', { class: 'deck-card' },
      h('div', { class: 'deck-cover' },
        cover ? h('img', { src: cover, alt: '' }) : h('span', { class: 'cover-empty', text: 'Sem capa' })),
      h('div', { class: 'deck-body' },
        h('h3', { text: deck.name }),
        h('div', { class: 'deck-meta' }, h('span', { class: 'tag', text: deck.format }), MD.colorPips(deck.colors)),
        h('div', { class: 'muted', text: n + (n === 1 ? ' carta' : ' cartas') }),
        h('div', { class: 'deck-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', text: 'Abrir deck',
            onclick: function () { MD.nav.show('deck', deck.id); } }),
          h('button', { type: 'button', class: 'btn btn-ghost-danger', text: 'Excluir',
            onclick: function () { deleteDeck(deck.id); } }))));
  }

  function renderHome(root) {
    const decks = MD.storage.get().decks;
    root.append(
      h('header', { class: 'page-head' },
        h('div', {}, h('h1', { text: 'Meus decks' }),
          h('p', { class: 'muted', text: decks.length ? 'Escolha um deck para gerenciar.' : 'Você ainda não tem decks.' })),
        h('button', { type: 'button', class: 'btn btn-primary', text: 'Novo deck', onclick: openCreateModal })));

    if (!decks.length) {
      root.append(h('div', { class: 'empty' },
        h('p', { text: 'Crie seu primeiro deck para começar a adicionar cartas.' }),
        h('button', { type: 'button', class: 'btn btn-primary', text: 'Criar deck', onclick: openCreateModal })));
      return;
    }

    const track = h('div', { class: 'carousel-track' }, decks.map(deckCard));
    const scroll = function (dir) { track.scrollBy({ left: dir * 640, behavior: 'smooth' }); };
    root.append(h('div', { class: 'carousel' },
      h('button', { type: 'button', class: 'carousel-btn', 'aria-label': 'Anterior', text: '‹', onclick: function () { scroll(-1); } }),
      track,
      h('button', { type: 'button', class: 'carousel-btn', 'aria-label': 'Próximo', text: '›', onclick: function () { scroll(1); } })));
  }

  // ---------- Deck page ----------

  function catalogItem(card, onRemove, onStatus) {
    const status = MD.cards.statusOf(card);
    return h('article', { class: 'card-item', tabindex: '0' },
      h('div', { class: 'card-media' },
        card.imageUrl ? h('img', { src: card.imageUrl, alt: card.name, loading: 'lazy' }) : MD.placeholder(card.name),
        h('span', { class: 'own-badge own-' + status, text: BADGE[status] })),
      h('div', { class: 'card-item-body' },
        h('div', { class: 'card-item-top' },
          h('strong', { text: card.name }),
          h('span', { class: 'qty', title: 'Quantidade no deck', text: '×' + card.quantity })),
        h('div', { class: 'card-item-line' }, MD.manaCost(card.manaCost) || h('span', { class: 'muted', text: 'Sem custo' })),
        h('div', { class: 'muted small', text: card.printedTypeLine || card.typeLine }),
        h('button', { type: 'button', class: 'btn btn-small', text: 'Remover 1', onclick: onRemove })),
      h('div', { class: 'card-item-extra' },
        MD.cards.storeLinks(card),
        h('select', { class: 'input status-select', 'aria-label': 'Status da carta',
          onchange: function (e) { onStatus(e.target.value); } },
          MD.cards.STATUSES.map(function (s) {
            return h('option', { value: s[0], text: s[1], selected: s[0] === status });
          }))));
  }

  function statsPanel(deck) {
    const s = MD.stats.compute(deck);
    const rows = [
      ['Total de cartas', s.total], ['Criaturas', s.creature], ['Terrenos', s.land],
      ['Encantamentos', s.enchantment], ['Sorceries', s.sorcery], ['Instants', s.instant],
      ['Artefatos', s.artifact], ['CMC médio', s.avgCmc === null ? '—' : s.avgCmc.toFixed(2)]
    ];
    return [h('h3', { text: 'Estatísticas' }), h('dl', {}, rows.map(function (r) {
      return h('div', { class: 'stat-row' }, h('dt', { text: r[0] }), h('dd', { text: String(r[1]) }));
    }))];
  }

  function renderDeck(root, id) {
    const deck = MD.storage.get().decks.find(function (d) { return d.id === id; });
    if (!deck) { MD.nav.show('home'); return; }
    deckFilter = 'all';
    ownFilter = 'all';

    const previewBox = h('div', { class: 'preview-box' });
    const catalogBox = h('div', {});
    const filterBox = h('div', { class: 'filters' });
    const statsBox = h('aside', { class: 'stats-panel' });

    function refresh() {
      const chip = function (label, active, fn) {
        return h('button', { type: 'button', class: 'chip' + (active ? ' active' : ''), text: label, onclick: fn });
      };
      MD.clear(filterBox).append(
        h('div', { class: 'chip-row' }, MD.cards.FILTERS.map(function (f) {
          return chip(f[1], deckFilter === f[0], function () { deckFilter = f[0]; refresh(); });
        })),
        h('div', { class: 'chip-row' }, STATUS_FILTERS.map(function (f) {
          return chip(f[1], ownFilter === f[0], function () { ownFilter = f[0]; refresh(); });
        })));

      const list = MD.cards.sorted(MD.cards.filter(deck.cards, deckFilter).filter(function (c) {
        return ownFilter === 'all' || MD.cards.statusOf(c) === ownFilter;
      }));
      MD.clear(catalogBox);
      if (!list.length) {
        catalogBox.append(h('div', { class: 'empty', text: deck.cards.length
          ? 'Nenhuma carta com esses filtros.' : 'Este deck está vazio. Pesquise uma carta acima para adicionar.' }));
      } else {
        catalogBox.append(h('div', { class: 'catalog-grid' }, list.map(function (c) {
          return catalogItem(c, function () {
            MD.cards.removeOne(deck, MD.cards.key(c));
            MD.storage.save();
            refresh();
          }, function (value) {
            c.status = value;
            delete c.owned;
            MD.storage.save();
            refresh();
          });
        })));
      }
      MD.clear(statsBox).append.apply(statsBox, statsPanel(deck));
    }

    function showPreview(card) {
      MD.clear(previewBox).append(h('div', { class: 'preview' },
        card.imageUrl ? h('img', { src: card.imageUrl, alt: card.name }) : MD.placeholder(card.name),
        h('div', { class: 'preview-info' },
          h('strong', { text: card.name }),
          h('div', {}, MD.manaCost(card.manaCost) || ''),
          h('div', { class: 'muted small', text: card.printedTypeLine || card.typeLine }),
          h('button', {
            type: 'button', class: 'btn btn-primary', text: 'Adicionar ao deck',
            onclick: function (e) {
              const entry = MD.cards.add(deck, card);
              MD.storage.save();
              refresh();
              e.target.textContent = 'Adicionada (×' + entry.quantity + ') — adicionar outra';
            }
          }))));
    }

    const box = MD.searchBox('Nome da carta em português', async function (term) {
      const my = ++searchSeq;
      box.setBusy(true);
      MD.clear(previewBox).append(MD.status('loading', 'Buscando na Scryfall…'));
      try {
        const card = await MD.scryfall.searchByName(term);
        if (my === searchSeq) showPreview(card);
      } catch (err) {
        if (my === searchSeq) MD.clear(previewBox).append(MD.status(err.kind === 'notfound' ? 'empty' : 'error', err.message));
      } finally {
        if (my === searchSeq) box.setBusy(false);
      }
    });

    root.append(
      h('header', { class: 'page-head' },
        h('div', {},
          h('button', { type: 'button', class: 'link-btn', text: '‹ Voltar aos decks', onclick: function () { MD.nav.show('home'); } }),
          h('h1', { text: deck.name }),
          h('div', { class: 'deck-meta' }, h('span', { class: 'tag', text: deck.format }), MD.colorPips(deck.colors)),
          deck.description ? h('p', { class: 'deck-desc', text: deck.description }) : null,
          deck.leagueUrl ? h('a', { href: deck.leagueUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Ver na Liga Magic' }) : null),
        h('button', { type: 'button', class: 'btn btn-ghost-danger', text: 'Excluir deck', onclick: function () { deleteDeck(deck.id); } })),
      h('section', { class: 'panel' }, h('h2', { text: 'Adicionar cartas' }), box.el, previewBox),
      h('section', {}, h('h2', { text: 'Cartas do deck' }), filterBox, catalogBox),
      statsBox);
    refresh();
  }

  MD.decks = { renderHome: renderHome, renderDeck: renderDeck };
})();