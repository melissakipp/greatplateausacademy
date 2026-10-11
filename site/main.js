// Great Plateaus Academy — landing page behavior
// The page works without JavaScript; this just adds friendlier validation.

(function () {
  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Newsletter form ----------
  var form = document.getElementById("subscribe-form");
  if (!form) return;

  var email = form.querySelector('input[type="email"]');
  var honeypot = form.querySelector('input[name="website"]');
  var message = form.querySelector(".form-message");
  var button = form.querySelector('button[type="submit"]');

  function show(text, kind) {
    message.textContent = text;
    message.className = "form-message " + (kind || "");
  }

  form.addEventListener("submit", function (e) {
    // Bot filled the hidden field: quietly pretend it worked
    if (honeypot && honeypot.value) {
      e.preventDefault();
      show("Thanks! Check your inbox.", "ok");
      return;
    }

    var value = email.value.trim();
    var looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    if (!looksValid) {
      e.preventDefault();
      email.setAttribute("aria-invalid", "true");
      email.focus();
      show(value ? "Error: please check your email address (example: name@example.com)."
                 : "Error: please enter your email address.", "error");
      return;
    }

    // Send the address without stray spaces
    email.value = value;
    email.removeAttribute("aria-invalid");
    button.disabled = true;
    button.textContent = "Subscribing…";
    // The browser now sends the form to Kit, which redirects to thanks.html
  });

  // If someone submits, then uses the Back button, re-enable the button
  window.addEventListener("pageshow", function () {
    button.disabled = false;
    button.textContent = "Subscribe";
  });

  email.addEventListener("input", function () {
    email.removeAttribute("aria-invalid");
    if (message.classList.contains("error")) show("");
  });
})();