// JSON export/import. Import validates first, then merges without deleting anything.
(function () {
  const MD = (window.MD = window.MD || {});
  const COLORS = ['W', 'U', 'B', 'R', 'G'];
  const STATUS_RANK = { owned: 2, buy: 1, missing: 0 };

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function str(v) { return typeof v === 'string' ? v : null; }
  function colors(a) { return Array.isArray(a) ? a.filter(function (c) { return COLORS.indexOf(c) >= 0; }) : []; }

  function cleanCard(c, where) {
    if (!isObj(c) || typeof c.name !== 'string' || !c.name.trim()) throw new Error(where + ': carta sem nome.');
    if (!Number.isInteger(c.quantity) || c.quantity < 1) throw new Error(where + ': quantidade inválida em "' + c.name + '".');
    return {
      id: str(c.id) || '',
      oracleId: str(c.oracleId),
      name: c.name.trim(),
      originalName: str(c.originalName),
      status: STATUS_RANK[c.status] !== undefined ? c.status : (c.owned === true ? 'owned' : 'missing'),
      quantity: c.quantity,
      manaCost: str(c.manaCost) || '',
      cmc: Number.isFinite(c.cmc) ? c.cmc : 0,
      typeLine: str(c.typeLine) || '',
      printedTypeLine: str(c.printedTypeLine),
      colors: colors(c.colors),
      colorIdentity: colors(c.colorIdentity),
      imageUrl: str(c.imageUrl),
      artUrl: str(c.artUrl)
    };
  }

  // Returns a clean deck list or throws an Error with a user-facing message.
  function parse(d) {
    if (!isObj(d)) throw new Error('O arquivo não é um backup do ManaDeck.');
    if (d.app !== undefined && d.app !== 'manadeck') throw new Error('O arquivo não é um backup do ManaDeck.');
    if (d.version !== 1) throw new Error('Versão de esquema não suportada: ' + d.version + '.');
    if (!Array.isArray(d.decks)) throw new Error('O arquivo não contém a lista de decks.');
    return d.decks.map(function (k, i) {
      const where = 'Deck ' + (i + 1);
      if (!isObj(k) || typeof k.id !== 'string' || !k.id.trim()) throw new Error(where + ': id ausente.');
      if (typeof k.name !== 'string' || !k.name.trim()) throw new Error(where + ': nome ausente.');
      if (k.cards !== undefined && !Array.isArray(k.cards)) throw new Error(where + ': lista de cartas inválida.');
      return {
        id: k.id,
        name: k.name.trim(),
        leagueUrl: str(k.leagueUrl) || '',
        format: str(k.format) || 'Outros',
        colors: colors(k.colors),
        description: str(k.description) || '',
        cards: (k.cards || []).map(function (c) { return cleanCard(c, where); })
      };
    });
  }

  function mergeCard(deck, card) {
    const k = MD.cards.key(card);
    const ex = deck.cards.find(function (x) { return MD.cards.key(x) === k; });
    if (ex) {
      ex.quantity += card.quantity;
      const cur = MD.cards.statusOf(ex);
      ex.status = STATUS_RANK[cur] >= STATUS_RANK[card.status] ? cur : card.status;
      delete ex.owned;
      if (!ex.originalName && card.originalName) ex.originalName = card.originalName;
    } else {
      deck.cards.push(card);
    }
  }

  // Works on a copy; existing deck metadata always wins.
  function merge(current, imported) {
    const draft = JSON.parse(JSON.stringify(current));
    let added = 0;
    let merged = 0;
    imported.forEach(function (k) {
      const ex = draft.decks.find(function (d) { return d.id === k.id; });
      if (ex) {
        k.cards.forEach(function (c) { mergeCard(ex, c); });
        merged++;
      } else {
        const nd = Object.assign({}, k, { cards: [] });
        k.cards.forEach(function (c) { mergeCard(nd, c); });
        draft.decks.push(nd);
        added++;
      }
    });
    return { draft: draft, added: added, merged: merged };
  }

  function exportData() {
    const data = MD.storage.get();
    const payload = {
      app: 'manadeck',
      version: 1,
      exportedAt: new Date().toISOString(),
      decks: data.decks,
      settings: data.settings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manadeck-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    MD.toast('Backup exportado.');
  }

  async function importFile(file) {
    try {
      let json;
      try {
        json = JSON.parse(await file.text());
      } catch (e) {
        throw new Error('O arquivo não é um JSON válido.');
      }
      const decks = parse(json);
      const res = merge(MD.storage.get(), decks);
      MD.storage.replace(res.draft);
      MD.toast('Importação concluída: ' + res.added + ' deck(s) novo(s), ' + res.merged + ' mesclado(s).');
      MD.nav.refresh();
    } catch (err) {
      MD.toast('Importação cancelada: ' + err.message + ' Nenhum dado foi alterado.', 'error');
    }
  }

  MD.backup = { exportData: exportData, importFile: importFile, parse: parse, merge: merge };
})();