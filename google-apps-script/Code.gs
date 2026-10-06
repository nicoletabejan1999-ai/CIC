/**
 * Google Apps Script pentru formularul de pe landing page CIC.
 *
 * Instrucțiuni de instalare — vezi README.md, secțiunea
 * "Formular funcțional (Google Sheets + Vercel)".
 *
 * Fiecare trimitere de formular adaugă un rând nou în foaia activă
 * a spreadsheet-ului la care este atașat acest script.
 */

// Un text care începe cu = + - @ ar fi interpretat de Sheets ca formulă.
function textSigur(value) {
  var text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Invalid JSON" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    new Date(),
    textSigur(data.nume),
    textSigur(data.telefon),
    data.sursa || "",
    data.consimtamant === true ? "DA" : "NU",
    textSigur(data.mesaj)
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
