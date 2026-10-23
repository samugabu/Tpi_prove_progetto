const Archivio = (function () {
  let locale = true;
  let cache = {};

  try {
    localStorage.setItem("__prova", "1");
    localStorage.removeItem("__prova");
  } catch (e) {
    locale = false;
    try {
      const letto = JSON.parse(window.name);
      if (letto && typeof letto === "object") cache = letto;
    } catch (err) {}
  }

  function salvaCache() {
    window.name = JSON.stringify(cache);
  }

  return {
    leggi(chiave) {
      if (locale) return localStorage.getItem(chiave);
      return chiave in cache ? cache[chiave] : null;
    },
    scrivi(chiave, valore) {
      if (locale) { localStorage.setItem(chiave, valore); return; }
      cache[chiave] = String(valore);
      salvaCache();
    },
    rimuovi(chiave) {
      if (locale) { localStorage.removeItem(chiave); return; }
      delete cache[chiave];
      salvaCache();
    }
  };
})();