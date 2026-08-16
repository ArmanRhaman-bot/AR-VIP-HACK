const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "CHANGE_THIS_MASTER_KEY";
const API_URL = process.env.API_URL || "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

const adminSessions = new Set();

app.get("/api/history", async (req, res) => {
  try {
    const r = await fetch(API_URL, {
      headers: { "User-Agent": "Mozilla/5.0 SmartPredictorWeb/1.0" },
      signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`);
    const json = await r.json();
    const list = json?.data?.list || [];
    res.json({ ok: true, list });
  } catch (e) {
    res.status(502).json({ ok: false, error: "Live data is temporarily unavailable." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (!password || password !== MASTER_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Invalid master key." });
  }
  const token = makeToken();
  adminSessions.add(token);
  res.json({ ok: true, token });
});

function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ ok: false, error: "Admin authentication required." });
  }
  next();
}

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  adminSessions.delete(token);
  res.json({ ok: true });
});

/*
  This dashboard intentionally does not place bets, manage a betting wallet,
  or automate wager execution. It only presents historical/live result data
  and a transparent statistical analysis.
*/
let settings = {
  interval: 60,
  sessionActive: false,
  channel: ""
};

app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json({ ok: true, settings });
});

app.post("/api/admin/settings", requireAdmin, (req, res) => {
  const interval = Number(req.body?.interval);
  const sessionActive = Boolean(req.body?.sessionActive);
  const channel = String(req.body?.channel || "").trim();

  if (![30, 60].includes(interval)) {
    return res.status(400).json({ ok: false, error: "Interval must be 30 or 60 seconds." });
  }

  settings = { interval, sessionActive, channel };
  res.json({ ok: true, settings });
});

app.get("/signal", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/signal/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Smart Predictor web dashboard running on port ${PORT}`);
});
