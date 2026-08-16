const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

const MASTER_PASSWORD =
  process.env.MASTER_PASSWORD || "CHANGE_THIS_MASTER_KEY";

const API_URL =
  process.env.API_URL ||
  "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

app.use(express.json());

// ========================================
// STATIC FILES
// ========================================

// তোমার সব HTML/CSS/JS root folder-এ আছে
app.use(express.static(__dirname));


// ========================================
// LIVE HISTORY API
// ========================================

app.get("/api/history", async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error("Upstream API error");
    }

    const json = await response.json();

    const list = json?.data?.list || [];

    res.json({
      ok: true,
      list: list
    });

  } catch (error) {

    console.error("History API Error:", error.message);

    res.status(502).json({
      ok: false,
      error: "Live data is temporarily unavailable."
    });
  }
});


// ========================================
// ADMIN SESSION SYSTEM
// ========================================

const adminSessions = new Set();

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}


// ========================================
// ADMIN LOGIN
// ========================================

app.post("/api/admin/login", (req, res) => {

  const password = String(req.body?.password || "");

  if (!password || password !== MASTER_PASSWORD) {

    return res.status(401).json({
      ok: false,
      error: "Invalid master key."
    });
  }

  const token = createToken();

  adminSessions.add(token);

  res.json({
    ok: true,
    token: token
  });
});


// ========================================
// ADMIN AUTH MIDDLEWARE
// ========================================

function requireAdmin(req, res, next) {

  const auth =
    String(req.headers.authorization || "");

  const token =
    auth.replace(/^Bearer\s+/i, "");

  if (!token || !adminSessions.has(token)) {

    return res.status(401).json({
      ok: false,
      error: "Admin authentication required."
    });
  }

  req.adminToken = token;

  next();
}


// ========================================
// ADMIN LOGOUT
// ========================================

app.post(
  "/api/admin/logout",
  requireAdmin,
  (req, res) => {

    adminSessions.delete(req.adminToken);

    res.json({
      ok: true
    });
  }
);


// ========================================
// ADMIN SETTINGS
// ========================================

let settings = {

  interval: 60,

  sessionActive: false,

  channel: ""
};


// GET SETTINGS

app.get(
  "/api/admin/settings",
  requireAdmin,
  (req, res) => {

    res.json({
      ok: true,
      settings: settings
    });
  }
);


// SAVE SETTINGS

app.post(
  "/api/admin/settings",
  requireAdmin,
  (req, res) => {

    const interval =
      Number(req.body?.interval);

    const sessionActive =
      Boolean(req.body?.sessionActive);

    const channel =
      String(req.body?.channel || "").trim();


    if (![30, 60].includes(interval)) {

      return res.status(400).json({

        ok: false,

        error:
          "Interval must be 30 or 60 seconds."
      });
    }


    settings = {

      interval,

      sessionActive,

      channel
    };


    res.json({

      ok: true,

      settings
    });
  }
);


// ========================================
// USER PANEL
// ========================================

app.get("/signal", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );
});


// ========================================
// ADMIN PANEL
// ========================================

app.get("/signal/admin", (req, res) => {

  res.sendFile(
    path.join(__dirname, "admin.html")
  );
});


// ========================================
// ROOT
// ========================================

app.get("/", (req, res) => {

  res.redirect("/signal");
});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `Smart Predictor running on port ${PORT}`
  );

});