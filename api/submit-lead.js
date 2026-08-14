// Vercel serverless function — proxies the lead form to a Google Apps Script
// web app so the script URL stays server-side (GOOGLE_SCRIPT_URL env var),
// never exposed in the page's client-side JS.

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

  const { nume, telefon } = req.body || {};
  if (!nume || !telefon || typeof nume !== "string" || typeof telefon !== "string") {
    res.status(400).json({ error: "Nume și telefon sunt obligatorii" });
    return;
  }

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

    if (!upstream.ok) {
      res.status(502).json({ error: "Trimiterea către Google Sheets a eșuat" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: "Trimiterea către Google Sheets a eșuat" });
  }
};
