const CHIAVE_UTENTE = "kanban_utente";
const CHIAVE_DATI = "kanban_dati";
const CHIAVE_VECCHIA = "kanban_attivita";
const STATI = ["da-fare", "in-corso", "completato"];

const UTENTI = [
  { username: "admin", password: "1234" },
  { username: "utente", password: "kanban" }
];

const Dati = (function () {
  const generaId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function carica() {
    const grezzo = Archivio.leggi(CHIAVE_DATI);
    if (grezzo !== null) {
      try {
        const letto = JSON.parse(grezzo);
        if (letto && Array.isArray(letto.progetti)) return letto;
      } catch (e) {}
      return { progetti: [] };
    }

    let attivita = [];
    try { attivita = JSON.parse(Archivio.leggi(CHIAVE_VECCHIA)); } catch (e) {}
    if (!Array.isArray(attivita) || attivita.length === 0) {
      attivita = [
        { id: generaId(), titolo: "Analisi dei requisiti", descrizione: "", priorita: "alta", assegnatario: "Marco", stato: "completato" },
        { id: generaId(), titolo: "Struttura HTML", descrizione: "Login e board", priorita: "media", assegnatario: "Giulia", stato: "in-corso" },
        { id: generaId(), titolo: "Drag and drop", descrizione: "", priorita: "alta", assegnatario: "Luca", stato: "da-fare" }
      ];
    }
    return { progetti: [{ id: generaId(), titolo: "Progetto Kanban", attivita: attivita }] };
  }

  let dati = carica();
  salva();

  function salva() {
    Archivio.scrivi(CHIAVE_DATI, JSON.stringify(dati));
  }

  function progetto(id) {
    return dati.progetti.find(p => p.id === id) || null;
  }

  return {
    /* ---- Sessione ---- */
    utente: () => Archivio.leggi(CHIAVE_UTENTE),

    accedi(username, password) {
      const u = UTENTI.find(x => x.username === username && x.password === password);
      if (u) Archivio.scrivi(CHIAVE_UTENTE, u.username);
      return Boolean(u);
    },

    esci() {
      Archivio.rimuovi(CHIAVE_UTENTE);
      window.location.href = "login.html";
    },

    richiediLogin() {
      if (Archivio.leggi(CHIAVE_UTENTE)) return true;
      window.location.replace("login.html");
      return false;
    },

    progetti: () => dati.progetti,
    progetto: progetto,

    creaProgetto(titolo) {
      dati.progetti.push({ id: generaId(), titolo: titolo, attivita: [] });
      salva();
    },

    eliminaProgetto(id) {
      dati.progetti = dati.progetti.filter(p => p.id !== id);
      salva();
    },

    avanzamento(p) {
      const totale = p.attivita.length;
      const completate = p.attivita.filter(a => a.stato === "completato").length;
      const percentuale = totale === 0 ? 0 : Math.round((completate / totale) * 100);
      return { totale, completate, percentuale };
    },

    salvaAttivita(idProgetto, campi) {
      const p = progetto(idProgetto);
      const esistente = campi.id ? p.attivita.find(a => a.id === campi.id) : null;
      if (esistente) Object.assign(esistente, campi);
      else p.attivita.push(Object.assign({}, campi, { id: generaId() }));
      salva();
    },

    eliminaAttivita(idProgetto, idAttivita) {
      const p = progetto(idProgetto);
      p.attivita = p.attivita.filter(a => a.id !== idAttivita);
      salva();
    },

    sposta(idProgetto, idAttivita, stato, primaDiId) {
      const p = progetto(idProgetto);
      const i = p.attivita.findIndex(a => a.id === idAttivita);
      if (i < 0 || !STATI.includes(stato)) return;

      const attivita = p.attivita.splice(i, 1)[0];
      attivita.stato = stato;

      const j = primaDiId ? p.attivita.findIndex(a => a.id === primaDiId) : -1;
      if (j >= 0) p.attivita.splice(j, 0, attivita);
      else p.attivita.push(attivita);
      salva();
    }
  };
})();