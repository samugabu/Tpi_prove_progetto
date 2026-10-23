/* board.js - area di lavoro di un progetto (id passato nell'URL: board.html?id=...) */

if (Dati.richiediLogin()) {
  const id = new URLSearchParams(window.location.search).get("id");
  if (Dati.progetto(id)) avvia(id);
  else window.location.replace("progetti.html");
}

function avvia(idProgetto) {
  const ETICHETTE = { bassa: "Bassa", media: "Media", alta: "Alta" };
  const template = document.getElementById("template-attivita");
  const board = document.getElementById("board");
  const dialog = document.getElementById("dialog-attivita");
  const form = document.getElementById("form-attivita");
  const campi = {
    id: document.getElementById("att-id"),
    titolo: document.getElementById("att-titolo"),
    descrizione: document.getElementById("att-descrizione"),
    priorita: document.getElementById("att-priorita"),
    stato: document.getElementById("att-stato"),
    assegnatario: document.getElementById("att-assegnatario")
  };
  const erroreTitolo = document.getElementById("errore-titolo");

  const progetto = () => Dati.progetto(idProgetto);

  document.getElementById("utente-corrente").textContent = Dati.utente();
  document.getElementById("titolo-progetto").textContent = progetto().titolo;
  document.getElementById("btn-logout").addEventListener("click", Dati.esci);

  /* ---------- Rendering ---------- */

  /* Ridisegna colonne, contatori e barra di avanzamento.
     Viene richiamata dopo ogni modifica, quindi la percentuale
     si aggiorna subito, anche durante il drag and drop. */
  function render() {
    STATI.forEach(function (stato) {
      const lista = progetto().attivita.filter(a => a.stato === stato);
      document.getElementById("colonna-" + stato).replaceChildren(...lista.map(creaScheda));
      document.getElementById("conteggio-" + stato).textContent = lista.length;
    });

    const av = Dati.avanzamento(progetto());
    document.getElementById("barra").style.width = av.percentuale + "%";
    document.getElementById("testo-avanzamento").textContent =
      av.percentuale + "% completato (" + av.completate + " di " + av.totale + " attività)";
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

    scheda.querySelector(".scheda-priorita").textContent = ETICHETTE[a.priorita];
    scheda.querySelector(".scheda-assegnatario").textContent = a.assegnatario ? "👤 " + a.assegnatario : "Non assegnata";
    scheda.querySelector(".btn-indietro").disabled = posizione === 0;
    scheda.querySelector(".btn-avanti").disabled = posizione === STATI.length - 1;
    return scheda;
  }

  /* ---------- Drag and drop (API HTML5 nativa) ---------- */

  /* Restituisce l'id della scheda davanti alla quale inserire quella
     trascinata, in base alla posizione verticale del mouse (null = in fondo). */
  function schedaSuccessiva(colonna, y) {
    const schede = colonna.querySelectorAll(".scheda:not(.in-trascinamento)");
    for (const s of schede) {
      const r = s.getBoundingClientRect();
      if (y < r.top + r.height / 2) return s.dataset.id;
    }
    return null;
  }

  function pulisciEvidenziazioni() {
    board.querySelectorAll(".drop-attivo").forEach(c => c.classList.remove("drop-attivo"));
  }

  board.addEventListener("dragstart", function (e) {
    const scheda = e.target.closest(".scheda");
    if (!scheda) return;
    e.dataTransfer.setData("text/plain", scheda.dataset.id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => scheda.classList.add("in-trascinamento"), 0);
  });

  board.addEventListener("dragend", function () {
    board.querySelectorAll(".in-trascinamento").forEach(s => s.classList.remove("in-trascinamento"));
    pulisciEvidenziazioni();
  });

  board.addEventListener("dragover", function (e) {
    const box = e.target.closest(".colonna-box");
    if (!box) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!box.classList.contains("drop-attivo")) {
      pulisciEvidenziazioni();
      box.classList.add("drop-attivo");
    }
  });

  board.addEventListener("drop", function (e) {
    const box = e.target.closest(".colonna-box");
    if (!box) return;
    e.preventDefault();

    const idAttivita = e.dataTransfer.getData("text/plain");
    const primaDi = schedaSuccessiva(box.querySelector(".colonna"), e.clientY);
    pulisciEvidenziazioni();

    Dati.sposta(idProgetto, idAttivita, box.dataset.stato, primaDi);
    render();
  });

  /* ---------- Pulsanti delle schede (alternativa al drag, utile su touch) ---------- */

  board.addEventListener("click", function (e) {
    const pulsante = e.target.closest("button");
    const scheda = pulsante && pulsante.closest(".scheda");
    if (!scheda) return;

    const id = scheda.dataset.id;
    const a = progetto().attivita.find(x => x.id === id);
    if (!a) return;

    if (pulsante.classList.contains("btn-avanti") || pulsante.classList.contains("btn-indietro")) {
      const passo = pulsante.classList.contains("btn-avanti") ? 1 : -1;
      const nuovo = STATI[STATI.indexOf(a.stato) + passo];
      if (nuovo) { Dati.sposta(idProgetto, id, nuovo, null); render(); }
    } else if (pulsante.classList.contains("btn-modifica")) {
      apriDialog(a);
    } else if (pulsante.classList.contains("btn-elimina")) {
      if (confirm("Eliminare questa attività?")) {
        Dati.eliminaAttivita(idProgetto, id);
        render();
      }
    }
  });

  /* ---------- Dialog di creazione/modifica ---------- */

  function apriDialog(a) {
    form.reset();
    erroreTitolo.hidden = true;
    document.getElementById("dialog-titolo").textContent = a ? "Modifica attività" : "Nuova attività";
    campi.id.value = a ? a.id : "";
    if (a) {
      campi.titolo.value = a.titolo;
      campi.descrizione.value = a.descrizione;
      campi.priorita.value = a.priorita;
      campi.stato.value = a.stato;
      campi.assegnatario.value = a.assegnatario;
    }
    dialog.showModal();
    campi.titolo.focus();
  }

  document.getElementById("btn-nuova").addEventListener("click", () => apriDialog(null));
  document.getElementById("btn-annulla").addEventListener("click", () => dialog.close());
  campi.titolo.addEventListener("input", () => { erroreTitolo.hidden = true; });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const titolo = campi.titolo.value.trim();
    if (titolo === "") {
      erroreTitolo.hidden = false;
      campi.titolo.focus();
      return;
    }

    Dati.salvaAttivita(idProgetto, {
      id: campi.id.value,
      titolo: titolo,
      descrizione: campi.descrizione.value.trim(),
      priorita: campi.priorita.value,
      assegnatario: campi.assegnatario.value.trim(),
      stato: campi.stato.value
    });
    dialog.close();
    render();
  });

  render();
}