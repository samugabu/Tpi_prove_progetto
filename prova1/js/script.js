const CHIAVE_ATTIVITA = "kanban_attivita";
const CHIAVE_UTENTE = "kanban_utente";
const STATI = ["da-fare", "in-corso", "completato"];
const PRIORITA = ["bassa", "media", "alta"];
const ETICHETTE_PRIORITA = { bassa: "Bassa", media: "Media", alta: "Alta" };

const ATTIVITA_INIZIALI = [
  { id: "a1", titolo: "Analisi dei requisiti", descrizione: "Compilare l'elaborato a PC spento", priorita: "alta", assegnatario: "Marco", stato: "completato" },
  { id: "a2", titolo: "Struttura HTML", descrizione: "Pagina di login e board", priorita: "media", assegnatario: "Giulia", stato: "in-corso" },
  { id: "a3", titolo: "Salvataggio nel localStorage", descrizione: "", priorita: "alta", assegnatario: "Luca", stato: "da-fare" }
];

const utente = Archivio.leggi(CHIAVE_UTENTE);

if (!utente) {
  window.location.replace("login.html");
} else {
  avvia();
}

function avvia() {
  const template = document.getElementById("template-attivita");
  const board = document.getElementById("board");
  const filtroPriorita = document.getElementById("filtro-priorita");
  const filtroAssegnatario = document.getElementById("filtro-assegnatario");
  const formFiltri = document.getElementById("form-filtri");
  const dialog = document.getElementById("dialog-attivita");
  const dialogTitolo = document.getElementById("dialog-titolo");
  const form = document.getElementById("form-attivita");
  const campoId = document.getElementById("att-id");
  const campoTitolo = document.getElementById("att-titolo");
  const campoDescrizione = document.getElementById("att-descrizione");
  const campoPriorita = document.getElementById("att-priorita");
  const campoStato = document.getElementById("att-stato");
  const campoAssegnatario = document.getElementById("att-assegnatario");
  const erroreTitolo = document.getElementById("errore-titolo");

  document.getElementById("utente-corrente").textContent = utente;

  let attivita = carica();

  function normalizza(a) {
    if (!a || typeof a !== "object") return null;
    const titolo = typeof a.titolo === "string" ? a.titolo.trim() : "";
    if (titolo === "") return null;

    return {
      id: typeof a.id === "string" && a.id ? a.id : generaId(),
      titolo: titolo,
      descrizione: typeof a.descrizione === "string" ? a.descrizione : "",
      priorita: PRIORITA.includes(a.priorita) ? a.priorita : "media",
      assegnatario: typeof a.assegnatario === "string" ? a.assegnatario : "",
      stato: STATI.includes(a.stato) ? a.stato : "da-fare"
    };
  }

  function carica() {
    const dati = Archivio.leggi(CHIAVE_ATTIVITA);
    if (dati === null) {
      return ATTIVITA_INIZIALI.map(function (a) { return Object.assign({}, a); });
    }
    try {
      const lista = JSON.parse(dati);
      if (!Array.isArray(lista)) return [];
      return lista.map(normalizza).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function salva() {
    Archivio.scrivi(CHIAVE_ATTIVITA, JSON.stringify(attivita));
  }

  function generaId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function trova(id) {
    return attivita.find(function (a) { return a.id === id; });
  }

  function render() {
    const fp = filtroPriorita.value;
    const fa = filtroAssegnatario.value.trim().toLowerCase();

    STATI.forEach(function (stato) {
      const colonna = document.getElementById("colonna-" + stato);
      colonna.replaceChildren();

      const lista = attivita.filter(function (a) {
        return a.stato === stato
          && (fp === "tutte" || a.priorita === fp)
          && a.assegnatario.toLowerCase().includes(fa);
      });

      lista.forEach(function (a) {
        colonna.appendChild(creaScheda(a));
      });

      document.getElementById("conteggio-" + stato).textContent = lista.length;
    });
  }

  function creaScheda(a) {
    const scheda = template.content.firstElementChild.cloneNode(true);
    const posizione = STATI.indexOf(a.stato);

    scheda.dataset.id = a.id;
    scheda.classList.add("priorita-" + a.priorita);
    scheda.querySelector(".scheda-titolo").textContent = a.titolo;

    const descrizione = scheda.querySelector(".scheda-descrizione");
    descrizione.textContent = a.descrizione;
    descrizione.hidden = !a.descrizione;

    scheda.querySelector(".scheda-priorita").textContent = ETICHETTE_PRIORITA[a.priorita];
    scheda.querySelector(".scheda-assegnatario").textContent = a.assegnatario ? "👤 " + a.assegnatario : "Non assegnata";

    scheda.querySelector(".btn-indietro").disabled = posizione === 0;
    scheda.querySelector(".btn-avanti").disabled = posizione === STATI.length - 1;

    return scheda;
  }

  function sposta(id, direzione) {
    const a = trova(id);
    if (!a) return;

    const nuovaPosizione = STATI.indexOf(a.stato) + direzione;
    if (nuovaPosizione < 0 || nuovaPosizione >= STATI.length) return;

    a.stato = STATI[nuovaPosizione];
    salva();
    render();
  }

  function elimina(id) {
    attivita = attivita.filter(function (a) { return a.id !== id; });
    salva();
    render();
  }

  function richiediConferma(pulsante, id) {
    if (pulsante.dataset.conferma === "1") {
      elimina(id);
      return;
    }

    pulsante.dataset.conferma = "1";
    pulsante.textContent = "Confermi?";

    setTimeout(function () {
      if (pulsante.isConnected) {
        pulsante.dataset.conferma = "";
        pulsante.textContent = "Elimina";
      }
    }, 3000);
  }

  function apriDialog(a, statoIniziale) {
    form.reset();
    erroreTitolo.hidden = true;

    if (a) {
      dialogTitolo.textContent = "Modifica attività";
      campoId.value = a.id;
      campoTitolo.value = a.titolo;
      campoDescrizione.value = a.descrizione;
      campoPriorita.value = a.priorita;
      campoStato.value = a.stato;
      campoAssegnatario.value = a.assegnatario;
    } else {
      dialogTitolo.textContent = "Nuova attività";
      campoId.value = "";
      if (statoIniziale) campoStato.value = statoIniziale;
    }

    dialog.showModal();
    campoTitolo.focus();
  }

  document.getElementById("btn-nuova").addEventListener("click", function () {
    apriDialog(null);
  });

  document.getElementById("btn-annulla").addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("click", function (e) {
    const area = dialog.getBoundingClientRect();
    const fuori = e.clientX < area.left || e.clientX > area.right
      || e.clientY < area.top || e.clientY > area.bottom;
    if (fuori) dialog.close();
  });

  campoTitolo.addEventListener("input", function () {
    erroreTitolo.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const titolo = campoTitolo.value.trim();
    if (titolo === "") {
      erroreTitolo.hidden = false;
      campoTitolo.focus();
      return;
    }

    const dati = {
      titolo: titolo,
      descrizione: campoDescrizione.value.trim(),
      priorita: campoPriorita.value,
      assegnatario: campoAssegnatario.value.trim(),
      stato: campoStato.value
    };

    const esistente = campoId.value ? trova(campoId.value) : null;

    if (esistente) {
      Object.assign(esistente, dati);
    } else {
      dati.id = generaId();
      attivita.push(dati);
    }

    salva();
    render();
    dialog.close();
  });

  board.addEventListener("click", function (e) {
    const pulsante = e.target.closest("button");
    if (!pulsante) return;

    if (pulsante.classList.contains("btn-aggiungi")) {
      apriDialog(null, pulsante.dataset.stato);
      return;
    }

    const scheda = pulsante.closest(".scheda");
    if (!scheda) return;
    const id = scheda.dataset.id;

    if (pulsante.classList.contains("btn-avanti")) {
      sposta(id, 1);
    } else if (pulsante.classList.contains("btn-indietro")) {
      sposta(id, -1);
    } else if (pulsante.classList.contains("btn-elimina")) {
      richiediConferma(pulsante, id);
    } else if (pulsante.classList.contains("btn-modifica")) {
      const a = trova(id);
      if (a) apriDialog(a);
    }
  });

  filtroPriorita.addEventListener("change", render);
  filtroAssegnatario.addEventListener("input", render);
  formFiltri.addEventListener("submit", function (e) {
    e.preventDefault();
  });
  formFiltri.addEventListener("reset", function () {
    setTimeout(render, 0);
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    Archivio.rimuovi(CHIAVE_UTENTE);
    window.location.href = "login.html";
  });

  salva();
  render();
}