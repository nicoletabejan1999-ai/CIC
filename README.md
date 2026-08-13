# CIC — Landing Page

Landing page static (HTML/CSS/JS, fără build step) pentru Centrul Implantologic Chișinău, construit după specificațiile de brand din `Landing Page Specs`.

## Structură

- `index.html` — pagina completă, secțiune cu secțiune conform documentului de specificații.
- `assets/css/style.css` — stiluri (culori de brand, tipografie mare, layout mobil-first).
- `assets/js/main.js` — logica butonului audio (play/pause).
- `assets/logo-cic.png` — logo-ul oficial CIC, decupat cerc din fotografia atașată, fundal transparent.
- `assets/img/dr-lazari.png` — fotografia reală a Dr. Vadim Lazari, decupată cerc, fundal transparent.
- `assets/img/testimonial-{ion,vera}-{before,after}.jpg` — fotografiile înainte/după ale pacienților din testimoniale, afișate în glisoare interactive (`.ba-slider`) cu bară trăgabilă la mijloc (Gheorghe M. nu are fotografie disponibilă). Fotografia lui Ion C. este reutilizată și în hero.
- `assets/img/video-poster.jpg` — cadru poster pentru videoclipul explicativ.
- `assets/audio/dr-lazari-mesaj.mp3` — mesajul audio real, vocea Dr. Lazari (~48 sec).
- `assets/video/proteza-vs-dinti-ficsi.mp4` — video explicativ (proteză mobilă vs. dinți ficși pe implant), în secțiunea de comparație. Transcodat din fișierul original (.mov/HEVC) în H.264/AAC pentru compatibilitate universală în browser.

## Culori de brand (confirmate)

| Rol | Culoare |
|---|---|
| Negru brand | `#111111` |
| Galben brand | `#FCD307` |
| Alb | `#FFFFFF` |
| Gri deschis | `#F4F4F4` |

Regulă strictă respectată în tot codul: **niciodată text galben pe alb sau alb pe galben** — galbenul apare doar ca fundal solid (buton, bandă de preț) sau ca iconiță pe fundal alb/negru.

## Ce trebuie înlocuit înainte de lansare (marcat clar în cod)

1. **Formularul final** — `action="#"` este placeholder; conectează-l la sistemul vostru de CRM/lead (webhook, Google Sheets, etc.).

Numărul de telefon (067 903 903), fotografiile, testimonialele, mesajul audio și videoclipul explicativ sunt deja cele reale/finale, furnizate de client.

## Verificare rapidă locală

```bash
cd assets/.. && python3 -m http.server 8080
# apoi deschide http://localhost:8080
```
