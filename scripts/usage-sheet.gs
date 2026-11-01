/**
 * Next Bus Up: board usage in a Google Sheet.
 *
 * Paste into the sheet's Extensions → Apps Script. It copies the page-view totals the site already
 * keeps in Cloudflare (worker/index.js: one count per board load, no visitor id) into the sheet,
 * one row per hour in Orlando time, and builds a summary tab. Setup is in README.md ("Usage sheet").
 *
 * Cloudflare keeps the counts for about three months. The sheet keeps every hour it has ever
 * copied, so run it at least once a month (the daily trigger does that for you).
 */

const ACCOUNT_ID = "c97de347c5c2f1623d76c923fd22659b";
const DATASET = "nbu_pageviews";
const TZ = "America/New_York"; // Orlando
const DAYS_BACK = 90;
const HOURLY = "Usage (hourly)";
const SUMMARY = "Usage summary";
const HEADERS = ["Hour (UTC)", "Day", "Hour", "Weekday #", "Weekday", "Views"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Next Bus Up")
    .addItem("Update usage now", "updateUsage")
    .addItem("Update every morning", "installDailyTrigger")
    .addToUi();
}

/** Copies the last 90 days of hourly totals in, replacing hours already there and keeping older ones. */
function updateUsage() {
  const token = PropertiesService.getScriptProperties().getProperty("CF_API_TOKEN");
  if (!token) throw new Error("Add CF_API_TOKEN under Project Settings → Script properties first.");

  const sql =
    `SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval * double1) AS views ` +
    `FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '${DAYS_BACK}' DAY ` +
    `GROUP BY hour ORDER BY hour FORMAT JSON`;
  const res = UrlFetchApp.fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "post",
      contentType: "text/plain",
      payload: sql,
      headers: { Authorization: `Bearer ${token}` },
      muteHttpExceptions: true,
    },
  );
  if (res.getResponseCode() !== 200) {
    throw new Error(`Cloudflare answered ${res.getResponseCode()}: ${res.getContentText().slice(0, 300)}`);
  }

  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(HOURLY) || book.insertSheet(HOURLY);
  const byHour = new Map();
  if (sheet.getLastRow() > 1) {
    for (const row of sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues()) {
      if (row[0]) byHour.set(String(row[0]), row);
    }
  }
  for (const { hour, views } of JSON.parse(res.getContentText()).data || []) {
    // "2026-10-23 14:00:00" in UTC. Kept as text so the sheet's own time zone can't shift it.
    const at = new Date(String(hour).replace(" ", "T") + "Z");
    byHour.set(String(hour), [
      String(hour),
      Utilities.formatDate(at, TZ, "yyyy-MM-dd"),
      Number(Utilities.formatDate(at, TZ, "H")),
      Number(Utilities.formatDate(at, TZ, "u")),
      Utilities.formatDate(at, TZ, "EEE"),
      Math.round(Number(views)),
    ]);
  }

  const rows = [...byHour.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  sheet.clearContents();
  sheet.getRange("A:B").setNumberFormat("@"); // before writing, so hours and days stay text
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  sheet.setFrozenRows(1);
  buildSummary(book);
}

/** Totals by day, by hour of day and by weekday, plus the last 7 and 30 days. Formulas only. */
function buildSummary(book) {
  const sheet = book.getSheetByName(SUMMARY) || book.insertSheet(SUMMARY);
  const src = `'${HOURLY}'`;
  const since = (days) =>
    `=IFERROR(QUERY(${src}!B:F,"select sum(F) where B >= '"&TEXT(TODAY()-${days - 1},"yyyy-mm-dd")&"' label sum(F) ''",1),0)`;
  sheet.clearContents();
  sheet.getRange("A1:B3").setValues([
    ["Views, last 7 days", since(7)],
    ["Views, last 30 days", since(30)],
    ["Updated", new Date()],
  ]);
  sheet.getRange("A5:G5").setValues([["By day", "", "", "By hour (Orlando)", "", "By weekday", ""]]);
  sheet.getRange("A6").setFormula(
    `=QUERY(${src}!B:F,"select B, sum(F) where B is not null group by B order by B desc label B 'Day', sum(F) 'Views'",1)`,
  );
  sheet.getRange("D6").setFormula(
    `=QUERY(${src}!C:F,"select C, sum(F) where C is not null group by C order by C label C 'Hour', sum(F) 'Views'",1)`,
  );
  sheet.getRange("F6").setFormula(
    `=QUERY(${src}!D:F,"select E, sum(F) where D is not null group by D, E order by D label E 'Weekday', sum(F) 'Views'",1)`,
  );
  sheet.getRange("A1:A3").setFontWeight("bold");
  sheet.getRange("A5:G5").setFontWeight("bold");
}

/** Runs updateUsage every day around 5 AM Orlando time. Safe to click twice. */
function installDailyTrigger() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "updateUsage") ScriptApp.deleteTrigger(trigger);
  }
  ScriptApp.newTrigger("updateUsage").timeBased().everyDays(1).atHour(5).inTimezone(TZ).create();
  updateUsage();
}
