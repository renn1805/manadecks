// Scryfall API client. Searches Portuguese printings first, then English,
// and returns a normalized card object for the first result.
(function () {
  const MD = (window.MD = window.MD || {});
  const URL_BASE = 'https://api.scryfall.com/cards/search';

  function ApiError(kind, message) {
    const e = new Error(message);
    e.kind = kind;
    return e;
  }

  function faceImage(card, size) {
    if (card.image_uris && card.image_uris[size]) return card.image_uris[size];
    const f = card.card_faces && card.card_faces[0];
    if (f && f.image_uris && f.image_uris[size]) return f.image_uris[size];
    return null;
  }

  function backImage(card) {
    if (card.image_uris) return null;
    const f = card.card_faces && card.card_faces[1];
    return f && f.image_uris ? f.image_uris.normal || null : null;
  }

  function normalize(c) {
    const faces = c.card_faces || [];
    const f0 = faces[0] || {};
    const pick = function (k) {
      if (c[k] !== undefined && c[k] !== null) return c[k];
      return f0[k] !== undefined ? f0[k] : null;
    };
    let text = c.printed_text || c.oracle_text || null;
    if (!text && faces.length) {
      text = faces.map(function (f) { return f.printed_text || f.oracle_text || ''; })
        .filter(Boolean).join('\n//\n') || null;
    }
    let printedType = c.printed_type_line || null;
    if (!printedType && faces.length && faces.every(function (f) { return f.printed_type_line; })) {
      printedType = faces.map(function (f) { return f.printed_type_line; }).join(' // ');
    }
    return {
      id: c.id,
      oracleId: c.oracle_id || f0.oracle_id || null,
      name: c.printed_name || c.name,
      originalName: c.printed_name && c.printed_name !== c.name ? c.name : null,
      lang: c.lang || null,
      manaCost: c.mana_cost || f0.mana_cost || '',
      cmc: Number(c.cmc) || 0,
      typeLine: c.type_line || '',
      printedTypeLine: printedType,
      oracleText: text,
      colors: c.colors || f0.colors || [],
      colorIdentity: c.color_identity || [],
      power: pick('power'),
      toughness: pick('toughness'),
      loyalty: pick('loyalty'),
      defense: pick('defense'),
      rarity: c.rarity || null,
      artist: c.artist || f0.artist || null,
      setName: c.set_name || null,
      collectorNumber: c.collector_number || null,
      imageUrl: faceImage(c, 'normal'),
      backImageUrl: backImage(c),
      artUrl: faceImage(c, 'art_crop'),
      legalities: c.legalities || {}
    };
  }

  // One request for a given language. Throws ApiError on any failure.
  async function searchLang(term, lang) {
    const url = URL_BASE + '?q=' + encodeURIComponent('"' + term + '" lang:' + lang);
    let res;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (e) {
      throw ApiError('network', 'Falha de conexão. Verifique sua internet e tente novamente.');
    }
    if (res.status === 404) throw ApiError('notfound', 'not found');
    if (res.status === 429) {
      throw ApiError('rate', 'Muitas requisições à Scryfall. Aguarde alguns segundos e tente de novo.');
    }
    let body;
    try {
      body = await res.json();
    } catch (e) {
      throw ApiError('invalid', 'A Scryfall devolveu uma resposta inválida.');
    }
    if (!res.ok) {
      throw ApiError('http', 'A Scryfall está indisponível no momento (erro ' + res.status + ').');
    }
    if (!body || !Array.isArray(body.data)) {
      throw ApiError('invalid', 'A Scryfall devolveu uma resposta inválida.');
    }
    if (!body.data.length) throw ApiError('notfound', 'not found');
    return normalize(body.data[0]);
  }

  // Portuguese first; English only when Portuguese finds nothing.
  async function searchByName(name) {
    const term = name.trim().replace(/"/g, '');
    try {
      return await searchLang(term, 'pt');
    } catch (e) {
      if (e.kind !== 'notfound') throw e;
    }
    try {
      return await searchLang(term, 'en');
    } catch (e) {
      if (e.kind !== 'notfound') throw e;
      throw ApiError('notfound', 'Nenhuma carta encontrada para "' + term + '" em português nem em inglês.');
    }
  }

  MD.scryfall = { searchByName: searchByName, normalize: normalize };
})();
