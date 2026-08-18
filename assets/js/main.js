(function () {
  "use strict";

  var video = document.getElementById("drVideo");
  var fab = document.getElementById("audioFab");
  if (!video) return;

  if (fab) fab.hidden = false;

  function setPressed(isPlaying) {
    if (fab) fab.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  }

  function play() {
    return video.play();
  }

  if (fab) {
    fab.addEventListener("click", function () {
      if (video.paused) {
        play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }

  video.addEventListener("play", function () { setPressed(true); });
  video.addEventListener("pause", function () { setPressed(false); });
  video.addEventListener("ended", function () { setPressed(false); });

  // Pornire instantă: încercăm autoplay la încărcare. Dacă browserul blochează
  // sunetul (comun la prima vizită, înainte de orice interacțiune), pornim
  // automat la prima atingere/click/tastă de oriunde pe pagină, o singură dată —
  // dar NUMAI dacă autoplay-ul chiar a eșuat, ca să nu repornească redarea
  // dacă vizitatorul apasă chiar el pauză (nativ sau din butonul flotant).
  play().catch(function () {
    function tryPlayOnFirstInteraction() {
      if (video.paused) play().catch(function () {});
    }
    document.addEventListener("click", tryPlayOnFirstInteraction, { once: true });
    document.addEventListener("touchstart", tryPlayOnFirstInteraction, { once: true, passive: true });
    document.addEventListener("keydown", tryPlayOnFirstInteraction, { once: true });
  });
})();

/* ---------- Slider comparație înainte / după ---------- */
(function () {
  "use strict";

  var sliders = document.querySelectorAll("[data-ba-slider]");

  sliders.forEach(function (root) {
    var frame = root.querySelector(".ba-slider__frame");
    var handle = root.querySelector(".ba-slider__handle");
    if (!frame || !handle) return;

    var dragging = false;

    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function posFromClientX(clientX) {
      var rect = frame.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function clientXFromEvent(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }

    function onDown(e) {
      dragging = true;
      setPos(posFromClientX(clientXFromEvent(e)));
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      setPos(posFromClientX(clientXFromEvent(e)));
      e.preventDefault();
    }

    function onUp() {
      dragging = false;
    }

    frame.addEventListener("mousedown", onDown);
    frame.addEventListener("touchstart", onDown, { passive: false });
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

/* ---------- Carusel cazuri hero ---------- */
(function () {
  "use strict";

  var carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach(function (root) {
    var slides = root.querySelectorAll(".hero-carousel__slide");
    var dots = root.querySelectorAll("[data-carousel-dot]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    if (!slides.length) return;

    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); });
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { show(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(current + 1); });
  });
})();

/* ---------- Formular final (trimite către Google Sheets via /api/submit-lead) ---------- */
(function () {
  "use strict";

  var form = document.getElementById("leadForm");
  var status = document.getElementById("leadFormStatus");
  if (!form || !status) return;

  var button = document.getElementById("leadFormSubmit");
  var consimtamant = document.getElementById("consimtamant");
  var hint = document.getElementById("leadFormHint");
  var idleLabel = button.textContent;

  // Butonul rămâne dezactivat până când vizitatorul bifează consimțământul;
  // textul explicativ dispare imediat ce nu mai e nevoie de el.
  function syncButtonState() {
    button.disabled = !consimtamant.checked;
    if (hint) hint.hidden = consimtamant.checked;
  }
  if (consimtamant) {
    consimtamant.addEventListener("change", syncButtonState);
    syncButtonState();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nume = form.nume.value.trim();
    var telefon = form.telefon.value.trim();
    if (!nume || !telefon || !consimtamant.checked) return;

    button.disabled = true;
    button.textContent = "Se trimite…";
    status.textContent = "";
    status.className = "lead-form__status";

    // event_id comun între Pixel (browser) și CAPI (server), pentru deduplicare în Meta.
    var eventId = "lead_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nume: nume, telefon: telefon, consimtamant: consimtamant.checked, eventId: eventId }),
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          status.textContent = "Mulțumim! Vă sunăm în cel mai scurt timp.";
          status.classList.add("lead-form__status--ok");
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
            status.textContent = "A apărut o eroare la trimitere" + detail + ". Sunați-ne direct la 067 903 903.";
            status.classList.add("lead-form__status--error");
          });
      })
      .catch(function () {
        status.textContent = "A apărut o eroare la trimitere (conexiune). Sunați-ne direct la 067 903 903.";
        status.classList.add("lead-form__status--error");
      })
      .finally(function () {
        button.textContent = idleLabel;
        syncButtonState();
      });
  });
})();
