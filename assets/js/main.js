(function () {
  "use strict";

  var audio = document.getElementById("drAudio");
  var toggle = document.getElementById("audioToggle");
  var label = document.getElementById("audioLabel");
  if (!audio || !toggle || !label) return;

  var LABEL_IDLE = "Ascultă un mesaj de la Dr. Lazari";
  var LABEL_PLAYING = "Se redă… apasă pentru pauză";
  var LABEL_UNAVAILABLE = "Mesajul audio nu este încă disponibil";

  toggle.addEventListener("click", function () {
    if (audio.paused) {
      audio.play().catch(function () {
        label.textContent = LABEL_UNAVAILABLE;
        toggle.setAttribute("aria-pressed", "false");
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", function () {
    toggle.setAttribute("aria-pressed", "true");
    label.textContent = LABEL_PLAYING;
  });

  audio.addEventListener("pause", function () {
    toggle.setAttribute("aria-pressed", "false");
    label.textContent = LABEL_IDLE;
  });

  audio.addEventListener("ended", function () {
    toggle.setAttribute("aria-pressed", "false");
    label.textContent = LABEL_IDLE;
  });

  audio.addEventListener("error", function () {
    label.textContent = LABEL_UNAVAILABLE;
    toggle.setAttribute("aria-pressed", "false");
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

  var button = form.querySelector("button[type=submit]");
  var idleLabel = button.textContent;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nume = form.nume.value.trim();
    var telefon = form.telefon.value.trim();
    if (!nume || !telefon) return;

    button.disabled = true;
    button.textContent = "Se trimite…";
    status.textContent = "";
    status.className = "lead-form__status";

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nume: nume, telefon: telefon }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("submit failed");
        form.reset();
        status.textContent = "Mulțumim! Vă sunăm în cel mai scurt timp.";
        status.classList.add("lead-form__status--ok");
      })
      .catch(function () {
        status.textContent = "A apărut o eroare la trimitere. Sunați-ne direct la 067 903 903.";
        status.classList.add("lead-form__status--error");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = idleLabel;
      });
  });
})();
