// Vercel serverless function — proxies the lead form to a Google Apps Script
// web app so the script URL stays server-side (GOOGLE_SCRIPT_URL env var),
// never exposed in the page's client-side JS. Also forwards the same lead
// to Meta's Conversions API (server-side Facebook Pixel tracking), using
// FB_PIXEL_ID + FB_CAPI_ACCESS_TOKEN — also kept server-side only.

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

  const { nume, telefon, eventId } = req.body || {};
  if (!nume || !telefon || typeof nume !== "string" || typeof telefon !== "string") {
    res.status(400).json({ error: "Nume și telefon sunt obligatorii" });
    return;
  }

  // CAPI e "best effort" — nu trebuie să strice trimiterea către Google Sheets dacă eșuează,
  // dar îl așteptăm explicit (nu fire-and-forget) fiindcă funcțiile serverless pot fi
  // înghețate imediat după ce răspunsul e trimis, omorând orice cerere neterminată.
  const capiPromise = sendToCapi({ telefon, eventId: eventId || String(Date.now()), req }).catch(function (err) {
    console.error("Trimiterea către Meta CAPI a eșuat:", err && err.message);
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
      }),
    });

    const upstreamText = await upstream.text();
    await capiPromise;

    if (!upstream.ok) {
      console.error("Google Apps Script a răspuns cu eroare:", upstream.status, upstreamText.slice(0, 500));
      res.status(502).json({ error: "Google Sheets a răspuns cu status " + upstream.status });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    await capiPromise;
    console.error("Fetch către Google Apps Script a eșuat:", err && err.message);
    res.status(502).json({ error: "Nu s-a putut contacta Google Sheets: " + (err && err.message) });
  }
};
