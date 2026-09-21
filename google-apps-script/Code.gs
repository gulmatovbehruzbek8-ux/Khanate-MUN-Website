/**
 * KhanateMUN backend that lives inside your Google Sheet (free, no Google Cloud account or card needed).
 * Setup: see README, "Connect Google Sheets without a card". Set the script property SECRET before deploying.
 */
const HEADERS = ["Time", "Name", "School", "Telegram", "Ticket", "Fee (UZS)", "Committee", "Referral", "Language", "Status"];
const REG = "Registrations";
const SETTINGS = "Settings";
const CONTENT = "Content";
const STATUSES = ["New", "Accepted", "Paid", "Rejected"];

function doGet() {
  return json_({ ok: true, hello: "KhanateMUN backend is running. Use it from the website." });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || req.secret !== secret) return json_({ ok: false, error: "unauthorized" });
    // Reads run in parallel and fast; only writes take the lock.
    if (req.action === "list" || req.action === "getSettings" || req.action === "getContent") {
      return json_({ ok: true, data: handle_(req) });
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      return json_({ ok: true, data: handle_(req) });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function handle_(req) {
  switch (req.action) {
    case "append": {
      const sh = tab_(REG, HEADERS);
      const row = req.row.map(String);
      const r = sh.getLastRow() + 1;
      sh.getRange(r, 1, 1, row.length).setNumberFormat("@").setValues([row]); // plain text, never a formula
      return null;
    }
    case "list": {
      const sh = tab_(REG, HEADERS);
      const n = sh.getLastRow() - 1;
      return n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getDisplayValues() : [];
    }
    case "setStatus": {
      if (STATUSES.indexOf(req.status) < 0 || !(req.row >= 2)) throw new Error("bad input");
      const sh = tab_(REG, HEADERS);
      sh.getRange(req.row, 10).setNumberFormat("@").setValue(req.status);
      return null;
    }
    case "deleteRows": {
      const sh = tab_(REG, HEADERS);
      req.rows.slice().sort(function (a, b) { return b - a; }).forEach(function (r) {
        if (r >= 2 && r <= sh.getLastRow()) sh.deleteRow(r); // bottom first so row numbers stay valid
      });
      return null;
    }
    case "clearRegistrations": {
      const sh = tab_(REG, HEADERS);
      const n = sh.getLastRow() - 1;
      if (n > 0) sh.deleteRows(2, n);
      return null;
    }
    case "getSettings":
      return kvAll_(SETTINGS);
    case "saveSettings":
      Object.keys(req.values).forEach(function (k) { kvSet_(SETTINGS, k, String(req.values[k])); });
      return null;
    case "getContent":
      return kvAll_(CONTENT);
    case "setContent":
      kvSet_(CONTENT, req.key, req.value);
      return null;
    default:
      throw new Error("unknown action");
  }
}

function tab_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

function kvAll_(name) {
  const sh = tab_(name, ["key", "value"]);
  const n = sh.getLastRow() - 1;
  const out = {};
  if (n > 0) sh.getRange(2, 1, n, 2).getValues().forEach(function (r) { if (r[0] && r[1] !== "") out[r[0]] = String(r[1]); });
  return out;
}

function kvSet_(name, key, value) {
  const sh = tab_(name, ["key", "value"]);
  const n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
  let row = 0;
  for (let i = 0; i < keys.length; i++) if (keys[i][0] === key) { row = i + 2; break; }
  if (value === null || value === undefined) {
    if (row) sh.getRange(row, 2).clearContent();
    return;
  }
  if (!row) row = sh.getLastRow() + 1;
  sh.getRange(row, 1, 1, 2).setNumberFormat("@").setValues([[key, String(value)]]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
