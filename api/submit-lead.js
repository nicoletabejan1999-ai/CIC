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

    const upstreamText = await upstream.text();

    if (!upstream.ok) {
      console.error("Google Apps Script a răspuns cu eroare:", upstream.status, upstreamText.slice(0, 500));
      res.status(502).json({ error: "Google Sheets a răspuns cu status " + upstream.status });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Fetch către Google Apps Script a eșuat:", err && err.message);
    res.status(502).json({ error: "Nu s-a putut contacta Google Sheets: " + (err && err.message) });
  }
};
