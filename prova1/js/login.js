if (Dati.utente()) {
  window.location.replace("progetti.html");
} else {
  const errore = document.getElementById("errore");

  document.getElementById("form-login").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (Dati.accedi(username, password)) {
      window.location.href = "../html/progetti.html";
    } else {
      errore.hidden = false;
    }
  });
}