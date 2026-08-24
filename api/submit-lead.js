// Vercel serverless function — proxies the lead form to a Google Apps Script
// web app so the script URL stays server-side (GOOGLE_SCRIPT_URL env var),
// never exposed in the page's client-side JS. Also forwards the same lead
// to Meta's Conversions API (server-side Facebook Pixel tracking), using
// FB_PIXEL_ID + FB_CAPI_ACCESS_TOKEN — also kept server-side only. And to
// Kommo CRM (KOMMO_SUBDOMAIN + KOMMO_ACCESS_TOKEN), tot server-side only.

const crypto = require("crypto");

function normalizePhone(raw) {
  var digits = String(raw).replace(/\D/g, "");
  if (digits.length === 9 && digits.charAt(0) === "0") {
    digits = "373" + digits.slice(1);
  }
  return digits;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function sendToCapi({ telefon, eventId, req }) {
  const pixelId = process.env.FB_PIXEL_ID;
  const accessToken = process.env.FB_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return; // CAPI neconfigurat — trecem peste, nu blocăm formularul.

  const phoneHash = sha256(normalizePhone(telefon));
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || "").split(",")[0].trim();

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: {
          ph: [phoneHash],
          client_ip_address: clientIp || undefined,
          client_user_agent: req.headers["user-agent"] || undefined,
        },
      },
    ],
  };

  const url = "https://graph.facebook.com/v19.0/" + pixelId + "/events?access_token=" + encodeURIComponent(accessToken);
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(function () { return ""; });
    console.error("Meta CAPI a răspuns cu eroare:", resp.status, text.slice(0, 500));
  }
}

async function sendToKommo({ nume, telefon, eventId }) {
  const subdomain = process.env.KOMMO_SUBDOMAIN;
  const token = process.env.KOMMO_ACCESS_TOKEN;

  if (!subdomain && !token) return; // Kommo neconfigurat — trecem peste, nu blocăm formularul.
  if (!subdomain || !token) {
    // Doar una din cele două variabile e setată — aproape sigur o greșeală de configurare
    // în Vercel (typo/uitată), nu o lipsă intenționată. Loghează distinct ca să nu treacă
    // neobservat drept "Kommo pur și simplu nefolosit încă".
    console.error(
      "[kommo] configurare incompletă: KOMMO_SUBDOMAIN=" + Boolean(subdomain) +
      " KOMMO_ACCESS_TOKEN=" + Boolean(token) + " eventId=" + eventId
    );
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 5000);

  try {
    // v1: fără field_id de câmp custom (ar necesita o căutare separată, specifică
    // fiecărui cont Kommo) — telefonul apare direct în numele lead-ului/contactului,
    // vizibil instant pe orice card din pipeline, fără nicio configurare suplimentară
    // în Kommo. Dacă tag-ul "Landing CIC" cauzează un 400 (cont care nu creează tag-uri
    // noi automat), cel mai simplu fix e să elimini array-ul "tags" de mai jos.
    const body = [
      {
        name: nume + " — " + telefon,
        _embedded: {
          contacts: [{ first_name: nume }],
          tags: [{ name: "Landing CIC" }],
        },
      },
    ];

    const resp = await fetch("https://" + subdomain + ".kommo.com/api/v4/leads/complex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(function () { return ""; });
      console.error("[kommo] crearea lead-ului a eșuat:", resp.status, "eventId=" + eventId, text.slice(0, 500));
    }
  } catch (err) {
    console.error("[kommo] eroare la crearea lead-ului, eventId=" + eventId + ":", err && err.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    res.status(500).json({ error: "GOOGLE_SCRIPT_URL nu este configurat" });
    return;
  }

  const { nume, telefon, consimtamant, eventId } = req.body || {};
  if (!nume || !telefon || typeof nume !== "string" || typeof telefon !== "string") {
    res.status(400).json({ error: "Nume și telefon sunt obligatorii" });
    return;
  }
  if (normalizePhone(telefon).length < 8) {
    res.status(400).json({ error: "Numărul de telefon nu este valid" });
    return;
  }
  if (consimtamant !== true) {
    res.status(400).json({ error: "Este necesar consimțământul pentru prelucrarea datelor" });
    return;
  }

  // CAPI și Kommo sunt "best effort" — nu trebuie să strice trimiterea către Google Sheets
  // dacă eșuează, dar le așteptăm explicit (nu fire-and-forget) fiindcă funcțiile serverless
  // pot fi înghețate imediat după ce răspunsul e trimis, omorând orice cerere neterminată.
  const eventIdOrDefault = eventId || String(Date.now());
  const capiPromise = sendToCapi({ telefon, eventId: eventIdOrDefault, req }).catch(function (err) {
    console.error("Trimiterea către Meta CAPI a eșuat:", err && err.message);
  });
  const kommoPromise = sendToKommo({ nume, telefon, eventId: eventIdOrDefault }).catch(function (err) {
    console.error("[kommo] eroare neprinsă:", err && err.message);
  });

  try {
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nume: nume.trim().slice(0, 200),
        telefon: telefon.trim().slice(0, 50),
        sursa: "landing page CIC",
        data: new Date().toISOString(),
        consimtamant: true,
      }),
    });

    const upstreamText = await upstream.text();
    await Promise.all([capiPromise, kommoPromise]);

    if (!upstream.ok) {
      console.error("Google Apps Script a răspuns cu eroare:", upstream.status, upstreamText.slice(0, 500));
      res.status(502).json({ error: "Google Sheets a răspuns cu status " + upstream.status });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    await Promise.all([capiPromise, kommoPromise]);
    console.error("Fetch către Google Apps Script a eșuat:", err && err.message);
    res.status(502).json({ error: "Nu s-a putut contacta Google Sheets: " + (err && err.message) });
  }
};
