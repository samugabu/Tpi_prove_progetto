if (Dati.richiediLogin()) avvia();

function avvia() {
  const elenco = document.getElementById("elenco-progetti");
  const vuoto = document.getElementById("vuoto");
  const template = document.getElementById("template-progetto");
  const campoTitolo = document.getElementById("titolo-progetto");

  document.getElementById("utente-corrente").textContent = Dati.utente();
  document.getElementById("btn-logout").addEventListener("click", Dati.esci);

  function creaCard(p) {
    const card = template.content.firstElementChild.cloneNode(true);
    const av = Dati.avanzamento(p);
    const indirizzo = "board.html?id=" + encodeURIComponent(p.id);

    card.querySelector(".progetto-titolo").textContent = p.titolo;
    card.querySelector(".progetto-link").href = indirizzo;
    card.querySelector(".progetto-apri").href = indirizzo;
    card.querySelector(".barra-riempita").style.width = av.percentuale + "%";
    card.querySelector(".progetto-info").textContent =
      av.percentuale + "% completato (" + av.completate + " di " + av.totale + " attività)";
    card.querySelector(".btn-elimina").dataset.id = p.id;
    return card;
  }

  function render() {
    elenco.replaceChildren(...Dati.progetti().map(creaCard));
    vuoto.hidden = Dati.progetti().length > 0;
  }

  document.getElementById("form-progetto").addEventListener("submit", function (e) {
    e.preventDefault();
    const titolo = campoTitolo.value.trim();
    if (titolo === "") return;
    Dati.creaProgetto(titolo);
    campoTitolo.value = "";
    render();
  });

  elenco.addEventListener("click", function (e) {
    const pulsante = e.target.closest(".btn-elimina");
    if (!pulsante) return;
    if (confirm("Eliminare il progetto e tutte le sue attività?")) {
      Dati.eliminaProgetto(pulsante.dataset.id);
      render();
    }
  });

  render();
}