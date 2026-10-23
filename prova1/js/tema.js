(function () {
  const CHIAVE = "kanban_tema";
  const SCELTE = [
    ["auto", "🌓 Automatico"],
    ["chiaro", "☀️ Chiaro"],
    ["scuro", "🌙 Scuro"]
  ];
  const sistemaScuro = window.matchMedia("(prefers-color-scheme: dark)");

  function leggi() {
    try {
      const salvata = localStorage.getItem(CHIAVE);
      return SCELTE.some(s => s[0] === salvata) ? salvata : "auto";
    } catch (e) {
      return "auto";
    }
  }

  function salva(valore) {
    try { localStorage.setItem(CHIAVE, valore); } catch (e) {}
  }

  let scelta = leggi();

  /* Imposta data-tema="chiaro" o "scuro" sul tag <html>: il CSS reagisce a questo. */
  function applica() {
    const scuro = scelta === "scuro" || (scelta === "auto" && sistemaScuro.matches);
    document.documentElement.dataset.tema = scuro ? "scuro" : "chiaro";
  }

  applica();
  sistemaScuro.addEventListener("change", applica);

  /* Crea il selettore e lo mette nella barra in alto (accanto al nome utente);
     nella pagina di login, che non ha la barra, lo fissa in alto a destra. */
  document.addEventListener("DOMContentLoaded", function () {
    const selettore = document.createElement("select");
    selettore.className = "selettore-tema";
    selettore.setAttribute("aria-label", "Tema del sito");

    SCELTE.forEach(function (s) {
      const opzione = document.createElement("option");
      opzione.value = s[0];
      opzione.textContent = s[1];
      selettore.appendChild(opzione);
    });

    selettore.value = scelta;
    selettore.addEventListener("change", function () {
      scelta = selettore.value;
      salva(scelta);
      applica();
    });

    const barra = document.querySelector(".utente");
    if (barra) {
      barra.prepend(selettore);
    } else {
      selettore.classList.add("selettore-fisso");
      document.body.appendChild(selettore);
    }
  });
})();