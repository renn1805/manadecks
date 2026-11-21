// Card logic (categories, filters, sorting, add/remove) and card detail view.
(function () {
  const MD = (window.MD = window.MD || {});
  const h = MD.h;

  // Priority order: used for default sorting and for stats (a card counts once, in the first match).
  const ORDER = ['creature', 'sorcery', 'instant', 'enchantment', 'artifact', 'land'];

  const FILTERS = [
    ['all', 'Todas'],
    ['creature', 'Criaturas'],
    ['land', 'Terrenos'],
    ['enchantment', 'Encantamentos'],
    ['sorcery', 'Sorceries'],
    ['instant', 'Instants'],
    ['artifact', 'Artefatos']
  ];

  const RARITY = {
    common: 'Comum', uncommon: 'Incomum', rare: 'Rara', mythic: 'Mítica',
    special: 'Especial', bonus: 'Bônus'
  };
  const LEGAL = { legal: 'Legal', not_legal: 'Não legal', banned: 'Banido', restricted: 'Restrito' };

  // English type line of the front face only.
  function frontType(c) {
    return (c.typeLine || '').split('//')[0];
  }

  function hasType(c, cat) {
    return new RegExp('\\b' + cat + '\\b', 'i').test(frontType(c));
  }

  function category(c) {
    for (let i = 0; i < ORDER.length; i++) if (hasType(c, ORDER[i])) return ORDER[i];
    return null;
  }

  function rank(c) {
    const cat = category(c);
    return cat ? ORDER.indexOf(cat) : ORDER.length;
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      return rank(a) - rank(b) || a.cmc - b.cmc || a.name.localeCompare(b.name, 'pt');
    });
  }

  function filter(list, cat) {
    return cat === 'all' ? list : list.filter(function (c) { return hasType(c, cat); });
  }

  // Same card (any printing) = same oracle id; fallback to lowercase name.
  function key(c) {
    return c.oracleId || 'name:' + String(c.name).toLowerCase();
  }

  // Per-card status inside a deck. Legacy data used a boolean `owned`.
  const STATUSES = [['owned', 'Tenho'], ['missing', 'Não tenho'], ['buy', 'A comprar']];

  function statusOf(c) {
    if (c.status === 'owned' || c.status === 'missing' || c.status === 'buy') return c.status;
    return c.owned === true ? 'owned' : 'missing';
  }

  // Store search link. Uses the English name when known, front face only.
  const STORES = [
    { name: 'Geek4Ever', base: 'https://www.geek4ever.com.br/?view=ecom%2Fitens&id=702687&searchExactMatch=&busca=' },
    { name: 'MTG Cards Games', base: 'https://www.mtgcardsgames.com.br/?view=ecom%2Fitens&id=15760&searchExactMatch=&busca=' }
  ];

  function storeUrl(card, store) {
    const name = String(card.originalName || card.name).split('//')[0].trim();
    return (store || STORES[0]).base + encodeURIComponent(name).replace(/%20/g, '+') + '&btnEnviar=1';
  }

  function storeLinks(card) {
    return STORES.map(function (store) {
      return h('a', {
        class: 'btn', href: storeUrl(card, store), target: '_blank', rel: 'noopener noreferrer',
        text: 'Pesquisar na ' + store.name
      });
    });
  }

  function add(deck, card) {
    const k = key(card);
    const existing = deck.cards.find(function (c) { return key(c) === k; });
    if (existing) {
      existing.quantity += 1;
      if (!existing.originalName && card.originalName) existing.originalName = card.originalName;
      return existing;
    }
    const entry = {
      id: card.id,
      oracleId: card.oracleId,
      name: card.name,
      originalName: card.originalName,
      status: 'missing',
      quantity: 1,
      manaCost: card.manaCost,
      cmc: card.cmc,
      typeLine: card.typeLine,
      printedTypeLine: card.printedTypeLine,
      colors: card.colors,
      colorIdentity: card.colorIdentity,
      imageUrl: card.imageUrl,
      artUrl: card.artUrl
    };
    deck.cards.push(entry);
    return entry;
  }

  function removeOne(deck, k) {
    const i = deck.cards.findIndex(function (c) { return key(c) === k; });
    if (i < 0) return;
    deck.cards[i].quantity -= 1;
    if (deck.cards[i].quantity <= 0) deck.cards.splice(i, 1);
  }

  function row(label, value) {
    if (value === null || value === undefined || value === '' ||
        (Array.isArray(value) && !value.length)) return null;
    return h('div', { class: 'info-row' },
      h('dt', { text: label }),
      h('dd', {}, value));
  }

  function renderDetail(card) {
    const src = card.printedTypeLine || card.typeLine || '';
    const faces = src.split('//').map(function (s) { return s.trim(); }).filter(Boolean);
    const types = faces.map(function (f) { return f.split('—')[0].trim(); }).join(' // ');
    const subtypes = faces.map(function (f) { return (f.split('—')[1] || '').trim(); })
      .filter(Boolean).join(' // ');

    const colorLabel = function (arr) {
      return arr.length
        ? h('span', { class: 'color-list' }, MD.colorPips(arr),
            ' ' + arr.map(function (c) { return MD.COLOR_NAMES[c] || c; }).join(', '))
        : 'Incolor';
    };

    const legalNames = Object.keys(card.legalities || {});

    const image = h('div', { class: 'detail-image' },
      card.imageUrl ? h('img', { src: card.imageUrl, alt: card.name }) : MD.placeholder(card.name),
      card.backImageUrl ? h('img', { src: card.backImageUrl, alt: card.name + ' (verso)' }) : null,
      storeLinks(card));

    const info = h('div', { class: 'detail-info' },
      h('h2', { text: card.name }),
      h('dl', { class: 'info-list' },
        row('Nome original', card.originalName),
        row('Custo de mana', MD.manaCost(card.manaCost)),
        row('Valor de mana (CMC)', String(card.cmc)),
        row('Tipo', types),
        row('Subtipos', subtypes),
        row('Poder', card.power),
        row('Resistência', card.toughness),
        row('Lealdade', card.loyalty),
        row('Defesa', card.defense),
        row('Raridade', card.rarity ? (RARITY[card.rarity] || card.rarity) : null),
        row('Identidade de cor', colorLabel(card.colorIdentity)),
        row('Cores', colorLabel(card.colors)),
        row('Artista', card.artist),
        row('Coleção', card.setName),
        row('Número da carta', card.collectorNumber),
        row('Idioma', card.lang === 'pt' ? 'Português' : card.lang === 'en' ? 'Inglês' : card.lang)),
      card.oracleText ? h('div', { class: 'oracle' },
        h('h3', { text: 'Texto e habilidades' }),
        h('p', { text: card.oracleText })) : null,
      legalNames.length ? h('div', {},
        h('h3', { text: 'Legalidade' }),
        h('div', { class: 'legal-grid' }, legalNames.map(function (f) {
          const s = card.legalities[f];
          return h('div', { class: 'legal-item' },
            h('span', { text: f.charAt(0).toUpperCase() + f.slice(1) }),
            h('span', { class: 'badge badge-' + s, text: LEGAL[s] || s }));
        }))) : null);

    return h('div', { class: 'detail' }, image, info);
  }

  MD.cards = {
    ORDER: ORDER,
    FILTERS: FILTERS,
    hasType: hasType,
    isLand: function (c) { return hasType(c, 'land'); },
    category: category,
    sorted: sorted,
    filter: filter,
    key: key,
    STATUSES: STATUSES,
    statusOf: statusOf,
    add: add,
    storeUrl: storeUrl,
    STORES: STORES,
    storeLinks: storeLinks,
    removeOne: removeOne,
    renderDetail: renderDetail
  };
})();