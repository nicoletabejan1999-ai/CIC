# CIC — Landing Page

Landing page static (HTML/CSS/JS, fără build step) pentru Centrul Implantologic Chișinău, construit după specificațiile de brand din `Landing Page Specs`.

## Structură

- `index.html` — pagina completă, secțiune cu secțiune conform documentului de specificații.
- `assets/css/style.css` — stiluri (culori de brand, tipografie mare, layout mobil-first).
- `assets/js/main.js` — logica butonului audio (play/pause).
- `assets/logo-cic.png` — logo-ul oficial CIC, decupat cerc din fotografia atașată, fundal transparent.

## Culori de brand (confirmate)

| Rol | Culoare |
|---|---|
| Negru brand | `#111111` |
| Galben brand | `#FCD307` |
| Alb | `#FFFFFF` |
| Gri deschis | `#F4F4F4` |

Regulă strictă respectată în tot codul: **niciodată text galben pe alb sau alb pe galben** — galbenul apare doar ca fundal solid (buton, bandă de preț) sau ca iconiță pe fundal alb/negru.

## Ce trebuie înlocuit înainte de lansare (marcat clar în cod)

1. **Numărul de telefon** — momentan placeholder `+373 60 000 000` în bara de sus, footer și bara fixă mobil (`index.html`, atributele `href="tel:..."`).
2. **Fotografia înainte/după** din hero — momentan un bloc grafic simplu (nu o fotografie reală de pacient). Înlocuiește `.hero__photo` cu un `<img>` real când aveți acordul pacientului.
3. **Fotografia Dr. Lazari** — momentan o iconiță simplă în `.doctor__photo`. Înlocuiește cu fotografia reală.
4. **Fișierul audio** — adaugă înregistrarea reală la `assets/audio/dr-lazari-mesaj.mp3` (scriptul de ~50 sec din documentul de specificații). Butonul „Ascultă” e complet funcțional și va reda automat fișierul odată adăugat; dacă fișierul lipsește, afișează „Mesajul audio nu este încă disponibil”.
5. **Formularul final** — `action="#"` este placeholder; conectează-l la sistemul vostru de CRM/lead (webhook, Google Sheets, etc.).

## Verificare rapidă locală

```bash
cd assets/.. && python3 -m http.server 8080
# apoi deschide http://localhost:8080
```
