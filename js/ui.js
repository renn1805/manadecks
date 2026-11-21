// Small DOM helpers shared by every screen. Builds nodes without innerHTML,
// so text coming from the API or from imported files is never parsed as HTML.
(function () {
  const MD = (window.MD = window.MD || {});

  MD.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    const a = attrs || {};
    Object.keys(a).forEach(function (k) {
      const v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat(Infinity).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return el;
  };

  MD.clear = function (el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  };

  MD.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const t = MD.h('div', { class: 'toast ' + (kind || 'info'), text: msg });
    box.append(t);
    setTimeout(function () { t.remove(); }, 4500);
  };

  MD.status = function (kind, msg) {
    return MD.h('div', { class: 'status status-' + kind },
      kind === 'loading' ? MD.h('span', { class: 'spinner' }) : null,
      MD.h('span', { text: msg }));
  };

  MD.placeholder = function (text) {
    return MD.h('div', { class: 'card-placeholder' }, MD.h('span', { text: text || 'Sem imagem' }));
  };

  MD.COLOR_NAMES = { W: 'Branco', U: 'Azul', B: 'Preto', R: 'Vermelho', G: 'Verde' };

  MD.colorPips = function (colors) {
    const list = colors || [];
    if (!list.length) return MD.h('span', { class: 'muted', text: '—' });
    return MD.h('span', { class: 'pips' }, list.map(function (c) {
      return MD.h('span', { class: 'pip pip-' + c, title: MD.COLOR_NAMES[c] || c, text: c });
    }));
  };

  MD.manaCost = function (cost) {
    const syms = (cost || '').match(/\{[^}]+\}/g);
    if (!syms) return null;
    return MD.h('span', { class: 'mana' }, syms.map(function (s) {
      const inner = s.slice(1, -1);
      const cls = /^[WUBRG]$/.test(inner) ? 'pip-' + inner : 'mana-generic';
      return MD.h('span', { class: 'mana-sym ' + cls, text: inner });
    }));
  };

  MD.searchBox = function (placeholder, onSubmit) {
    const input = MD.h('input', { type: 'search', class: 'input', placeholder: placeholder, autocomplete: 'off' });
    const btn = MD.h('button', { type: 'submit', class: 'btn btn-primary', text: 'Buscar' });
    const el = MD.h('form', {
      class: 'searchbar',
      onsubmit: function (e) {
        e.preventDefault();
        const v = input.value.trim();
        if (v) onSubmit(v);
      }
    }, input, btn);
    return {
      el: el,
      input: input,
      setBusy: function (b) {
        btn.disabled = b;
        btn.textContent = b ? 'Buscando…' : 'Buscar';
      }
    };
  };
})();
