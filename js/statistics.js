// Deck statistics. A card counts once, in its highest-priority category.
(function () {
  const MD = (window.MD = window.MD || {});

  MD.stats = {
    compute: function (deck) {
      const s = {
        total: 0, creature: 0, land: 0, enchantment: 0,
        sorcery: 0, instant: 0, artifact: 0, avgCmc: null
      };
      let sum = 0;
      let qty = 0;
      deck.cards.forEach(function (c) {
        s.total += c.quantity;
        const cat = MD.cards.category(c);
        if (cat) s[cat] += c.quantity;
        // Lands are excluded from the average; zero-cost spells are included.
        if (!MD.cards.isLand(c)) {
          sum += c.cmc * c.quantity;
          qty += c.quantity;
        }
      });
      s.avgCmc = qty ? sum / qty : null;
      return s;
    }
  };
})();
