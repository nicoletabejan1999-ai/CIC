/* CIC — pagina „Dinți ficși în 4 zile” (/dinti-ficsi/) */

/* ---------- Eveniment Meta „Contact”: orice clic pe telefon / WhatsApp ---------- */
// Lead rămâne strict pentru trimiterea formularului (mai jos). Contact se trimite
// de pe fiecare buton marcat cu data-contact, oriunde apare pe pagină.
(function () {
  "use strict";

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("[data-contact]") : null;
    if (!link || typeof fbq !== "function") return;
    var canal = link.getAttribute("href").indexOf("wa.me") !== -1 ? "whatsapp" : "telefon";
    fbq("track", "Contact", { content_name: link.getAttribute("data-contact"), content_category: canal });
  });
})();

/* ---------- Slider comparație înainte / după ---------- */
(function () {
  "use strict";

  document.querySelectorAll("[data-ba-slider]").forEach(function (root) {
    var frame = root.querySelector(".ba-slider__frame");
    var handle = root.querySelector(".ba-slider__handle");
    if (!frame || !handle) return;

    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function posFromEvent(e) {
      var clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      var rect = frame.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onDown(e) {
      dragging = true;
      setPos(posFromEvent(e));
      if (e.type === "mousedown") e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      setPos(posFromEvent(e));
      if (e.cancelable) e.preventDefault();
    }

    function onUp() {
      dragging = false;
    }

    frame.addEventListener("mousedown", onDown);
    frame.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    handle.addEventListener("keydown", function (e) {
      var current = parseFloat(frame.style.getPropertyValue("--pos")) || 50;
      if (e.key === "ArrowLeft") { setPos(current - 5); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setPos(current + 5); e.preventDefault(); }
      else if (e.key === "Home") { setPos(0); e.preventDefault(); }
      else if (e.key === "End") { setPos(100); e.preventDefault(); }
    });
  });
})();

/* ---------- Derulare orizontală (diplome) ---------- */
(function () {
  "use strict";

  document.querySelectorAll("[data-hscroll]").forEach(function (root) {
    var track = root.querySelector(".hscroll__track");
    var prev = root.querySelector("[data-hscroll-prev]");
    var next = root.querySelector("[data-hscroll-next]");
    if (!track) return;

    function step(dir) {
      track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  });
})();

/* ---------- Cardurile „pentru tine, dacă…” precompletează mesajul din formular ---------- */
(function () {
  "use strict";

  var mesaj = document.getElementById("mesaj");
  if (!mesaj) return;

  document.querySelectorAll("[data-situatie]").forEach(function (card) {
    card.addEventListener("click", function () {
      if (!mesaj.value.trim()) mesaj.value = card.getAttribute("data-situatie") + " ";
    });
  });
})();

/* ---------- Formular (trimite către /api/submit-lead, la fel ca pagina principală) ---------- */
(function () {
  "use strict";

  var form = document.getElementById("leadForm");
  var status = document.getElementById("leadFormStatus");
  if (!form || !status) return;

  var button = document.getElementById("leadFormSubmit");
  var consimtamant = document.getElementById("consimtamant");
  var hint = document.getElementById("leadFormHint");
  var idleLabel = button.textContent;

  function syncButtonState() {
    button.disabled = !consimtamant.checked;
    if (hint) hint.hidden = consimtamant.checked;
  }
  consimtamant.addEventListener("change", syncButtonState);
  syncButtonState();

  function showError(text) {
    status.textContent = text;
    status.className = "lead-form__status lead-form__status--error";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nume = form.nume.value.trim();
    var telefon = form.telefon.value.trim();
    var mesaj = form.mesaj.value.trim();
    if (!consimtamant.checked) return;
    if (!nume) { showError("Scrieți numele, vă rugăm."); form.nume.focus(); return; }
    if (telefon.replace(/\D/g, "").length < 8) {
      showError("Introduceți un număr de telefon valid.");
      form.telefon.focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Se trimite…";
    status.textContent = "";
    status.className = "lead-form__status";

    // event_id comun între Pixel (browser) și CAPI (server), pentru deduplicare în Meta.
    var eventId = "lead_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nume: nume,
        telefon: telefon,
        mesaj: mesaj,
        pagina: "dinti-ficsi",
        consimtamant: consimtamant.checked,
        eventId: eventId,
      }),
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          status.textContent = "Mulțumim! Vă sunăm în cel mai scurt timp.";
          status.className = "lead-form__status lead-form__status--ok";
          if (typeof fbq === "function") {
            fbq("track", "Lead", {}, { eventID: eventId });
          }
          return;
        }
        return res
          .json()
          .catch(function () { return {}; })
          .then(function (body) {
            var detail = body && body.error ? " (" + body.error + ")" : "";
            showError("A apărut o eroare la trimitere" + detail + ". Sunați-ne direct la 067 903 903.");
          });
      })
      .catch(function () {
        showError("A apărut o eroare la trimitere (conexiune). Sunați-ne direct la 067 903 903.");
      })
      .finally(function () {
        button.textContent = idleLabel;
        syncButtonState();
      });
  });
})();
