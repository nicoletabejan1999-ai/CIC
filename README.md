# CIC — Landing Page

Landing page static (HTML/CSS/JS, fără build step) pentru Centrul Implantologic Chișinău, construit după specificațiile de brand din `Landing Page Specs`.

## Structură

- `index.html` — pagina completă, secțiune cu secțiune conform documentului de specificații.
- `assets/css/style.css` — stiluri (culori de brand, tipografie mare, layout mobil-first).
- `assets/js/main.js` — logica butonului audio (play/pause).
- `assets/logo-cic.png` — logo-ul oficial CIC, decupat cerc din fotografia atașată, fundal transparent.
- `assets/img/dr-lazari.png` — fotografia reală a Dr. Vadim Lazari, decupată cerc, fundal transparent.
- `assets/img/testimonial-{ion,vera}-{before,after}.jpg` — fotografiile înainte/după ale pacienților din testimoniale, afișate în glisoare interactive (`.ba-slider`) cu bară trăgabilă la mijloc (Gheorghe M. nu are fotografie disponibilă).
- `assets/img/testimonial-{woman2,man2}-{before,after}.jpg` — încă 2 cazuri reale, folosite doar în caruselul din hero (`.hero-carousel`) alături de cazul lui Ion C. — 3 cazuri navigabile cu săgeți/puncte, câte unul vizibil o dată.
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
2. **Numărul „10 consultații disponibile zilnic"** din banda galbenă de sub bara de sus (`.urgency-bar`, în `index.html`) — confirmați cifra reală de consultații pe care clinica le poate onora zilnic înainte de lansare.
3. **„Valoare reală: 300 lei"** din secțiunea „Ce vei afla în cadrul consultației telefonice?" (`.call-value__price-label`, în `index.html`) — placeholder; confirmați valoarea reală a unei consultații similare plătite, pentru a susține argumentul „GRATUIT".
4. **Secțiunea „Cum va decurge vizita ta?"** (`.visit`, în `index.html`) — cei 4 pași sunt o presupunere rezonabilă a fluxului unei consultații (primire, radiografie 3D, consult, plan + preț fix), fără fotografii reale din clinică (nu am avut poze reale disponibile, așa că am folosit iconițe în loc de poze stock care ar fi părut fals prezentate ca fiind clinica voastră). Confirmați că pașii descriși corespund fluxului real și, dacă vreți, înlocuiți iconițele cu fotografii reale din clinică.

Numărul de telefon (067 903 903), fotografiile, testimonialele, mesajul audio și videoclipul explicativ sunt deja cele reale/finale, furnizate de client.

## Verificare rapidă locală

```bash
cd assets/.. && python3 -m http.server 8080
# apoi deschide http://localhost:8080
```
