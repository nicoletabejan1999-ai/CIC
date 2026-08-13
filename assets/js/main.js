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
