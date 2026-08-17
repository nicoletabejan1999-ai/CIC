# CIC — Landing Page

Landing page static (HTML/CSS/JS, fără build step) pentru Centrul Implantologic Chișinău, construit după specificațiile de brand din `Landing Page Specs`.

## Structură

- `index.html` — pagina completă, secțiune cu secțiune conform documentului de specificații.
- `assets/css/style.css` — stiluri (culori de brand, tipografie mare, layout mobil-first).
- `assets/js/main.js` — logica butonului audio (play/pause).
- `assets/logo-cic.png` — logo-ul oficial CIC, decupat cerc din fotografia atașată, fundal transparent.
- `assets/img/dr-lazari.png` — fotografia reală a Dr. Vadim Lazari, decupată cerc, fundal transparent.
- `assets/img/testimonial-{ion,vera}-{before,after}.jpg` — fotografiile înainte/după ale pacienților din testimoniale, afișate în glisoare interactive (`.ba-slider`) cu bară trăgabilă la mijloc (Gheorghe M. nu are fotografie disponibilă).
- `assets/img/testimonial-{woman2,man2,woman3}-{before,after}.jpg` — încă 3 cazuri reale, folosite doar în caruselul din hero (`.hero-carousel`) alături de cazul lui Ion C. — 4 cazuri navigabile cu săgeți/puncte, câte unul vizibil o dată.
- `assets/img/video-poster.jpg` — cadru poster pentru videoclipul explicativ.
- `assets/audio/dr-lazari-mesaj.mp3` — mesajul audio real, vocea Dr. Lazari (~48 sec).
- `assets/video/proteza-vs-dinti-ficsi.mp4` — video explicativ (proteză mobilă vs. dinți ficși pe implant), în secțiunea de comparație. Transcodat din fișierul original (.mov/HEVC) în H.264/AAC pentru compatibilitate universală în browser.
- `api/submit-lead.js` — funcție serverless Vercel; primește datele din formular și le trimite mai departe către Google Apps Script (URL-ul citit din variabila de mediu `GOOGLE_SCRIPT_URL`, niciodată expus în codul din browser).
- `google-apps-script/Code.gs` — codul de lipit în Google Apps Script, care scrie fiecare trimitere de formular ca rând nou într-un Google Sheet.

## Culori de brand (confirmate)

| Rol | Culoare |
|---|---|
| Negru brand | `#111111` |
| Galben brand | `#FCD307` |
| Alb | `#FFFFFF` |
| Gri deschis | `#F4F4F4` |

Regulă strictă respectată în tot codul: **niciodată text galben pe alb sau alb pe galben** — galbenul apare doar ca fundal solid (buton, bandă de preț) sau ca iconiță pe fundal alb/negru.

## Formular funcțional (Google Sheets + Vercel)

Formularul final trimite acum datele (nume + telefon) către un Google Sheet, printr-o funcție serverless Vercel care ține URL-ul Google Apps Script ascuns într-o variabilă de mediu. Pași de configurare (o singură dată):

**1. Google Sheet + Apps Script**
1. Creați un Google Sheet nou (ex. „Lead-uri CIC"). Opțional, adăugați pe primul rând titlurile: `Data | Nume | Telefon | Sursă`.
2. În Sheet: `Extensii → Apps Script`.
3. Ștergeți codul din editor și lipiți conținutul fișierului `google-apps-script/Code.gs` din acest repo.
4. `Deploy → New deployment → Select type: Web app`.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Apăsați `Deploy`, autorizați accesul la contul Google când vi se cere, apoi copiați **URL-ul aplicației web** rezultat (arată cam așa: `https://script.google.com/macros/s/XXXXXXXX/exec`).

**2. Vercel**
1. Importați acest repo ca proiect nou în Vercel (dacă nu e deja).
2. `Project Settings → Environment Variables` → adăugați:
   - Name: `GOOGLE_SCRIPT_URL`
   - Value: URL-ul copiat la pasul anterior
3. Redeploy (Vercel redeployează automat la următorul push, sau apăsați „Redeploy" manual).

După acești pași, fiecare trimitere din formularul de pe pagină apare ca rând nou în Google Sheet. Dacă trimiterea eșuează (ex. variabila de mediu lipsește), formularul afișează un mesaj clar și îndeamnă utilizatorul să sune direct la 067 903 903 — niciodată o eroare silențioasă.

**Notă:** dacă site-ul rămâne găzduit pe GitHub Pages (fără server), funcția din `api/` nu va rula — GitHub Pages servește doar fișiere statice. Pentru ca formularul să funcționeze cu adevărat, site-ul trebuie găzduit pe Vercel (sau alt hosting cu suport pentru funcții serverless).

## Mesajul audio — pornire automată

Mesajul Dr. Lazari pornește acum automat la încărcarea paginii, cu un buton flotant permanent în colțul stânga jos (peste tot pe pagină) ca vizitatorul să-l poată opri oricând, plus butonul original din secțiunea medicului.

**Important:** niciun site nu poate garanta 100% pornirea automată cu sunet — Chrome și Safari blochează de obicei autoplay cu sunet la prima vizită a unui domeniu, indiferent de cod (politică de browser, nu ceva ce putem controla din site). Codul încearcă autoplay la încărcare; dacă browserul îl blochează, pornește automat la prima atingere/click/tastă de oriunde pe pagină — practic instant din perspectiva vizitatorului, fără să mai fie nevoie să caute butonul.

Notă: specificațiile inițiale de brand recomandau ca pornirea să NU fie automată ("deranjează și consumă date"). Am implementat totuși autoplay, la cererea explicită ulterioară.

## Meta Pixel + Conversions API (CAPI)

Pagina trimite evenimentul „Lead" (cineva a completat formularul) atât din browser (Pixel), cât și direct de pe server (CAPI) — dublă urmărire, recomandată de Meta, cu deduplicare automată prin același `event_id` trimis pe ambele căi. Sunt două lucruri diferite, din locuri diferite:

**Pixel ID** — *nu e secret* (apare oricum vizibil în codul paginii de fiecare dată când se încarcă), de asta e scris direct în `index.html`, nu ca variabilă de mediu:
1. Meta Events Manager → Data Sources → Pixel-ul vostru → `Settings` → copiați **Pixel ID** (un număr, ex. `123456789012345`).
2. În `index.html`, căutați `YOUR_PIXEL_ID` (apare de 2 ori, în `<script>` și în `<noscript>`) și înlocuiți-l cu Pixel ID-ul real.

**CAPI Access Token** — *acesta chiar e secret* (oricine îl are poate trimite evenimente false în numele vostru), de asta stă doar ca variabilă de mediu în Vercel, niciodată în cod:
1. Meta Events Manager → Data Sources → Pixel-ul vostru → `Settings` → secțiunea „Conversions API" → `Generate access token`.
2. În Vercel: `Project Settings → Environment Variables` → adăugați:
   - `FB_PIXEL_ID` — același Pixel ID de mai sus (funcția serverless are nevoie de el ca să știe către ce Pixel trimite evenimentele CAPI)
   - `FB_CAPI_ACCESS_TOKEN` — token-ul generat la pasul anterior
3. Redeploy.

Dacă `FB_PIXEL_ID` / `FB_CAPI_ACCESS_TOKEN` lipsesc, funcția serverless sare peste trimiterea CAPI fără nicio eroare — formularul tot funcționează normal, doar fără urmărirea server-side. Numărul de telefon e trimis către Meta hash-uit (SHA-256), niciodată în clar.

## Ce trebuie înlocuit înainte de lansare (marcat clar în cod)

1. **Numărul „10 consultații disponibile zilnic"** din banda galbenă de sub bara de sus (`.urgency-bar`, în `index.html`) — confirmați cifra reală de consultații pe care clinica le poate onora zilnic înainte de lansare.
2. **„Valoare reală: 300 lei"** din secțiunea „Ce vei afla în cadrul consultației telefonice?" (`.call-value__price-label`, în `index.html`) — placeholder; confirmați valoarea reală a unei consultații similare plătite, pentru a susține argumentul „GRATUIT".
3. **Secțiunea „Cum va decurge vizita ta?"** (`.visit`, în `index.html`) — cei 4 pași sunt o presupunere rezonabilă a fluxului unei consultații (primire, radiografie 3D, consult, plan + preț fix), fără fotografii reale din clinică (nu am avut poze reale disponibile, așa că am folosit iconițe în loc de poze stock care ar fi părut fals prezentate ca fiind clinica voastră). Confirmați că pașii descriși corespund fluxului real și, dacă vreți, înlocuiți iconițele cu fotografii reale din clinică.
4. **`YOUR_PIXEL_ID`** din `index.html` (Meta Pixel, apare de 2 ori) — vezi secțiunea „Meta Pixel + Conversions API" de mai sus.

Numărul de telefon (067 903 903), fotografiile, testimonialele, mesajul audio și videoclipul explicativ sunt deja cele reale/finale, furnizate de client.

## Verificare rapidă locală

```bash
cd assets/.. && python3 -m http.server 8080
# apoi deschide http://localhost:8080
```
