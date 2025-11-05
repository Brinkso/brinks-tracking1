// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { Pool } = require("pg"); // PostgreSQL

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.use(
  session({
    secret: "brinkssecurekey",
    resave: false,
    saveUninitialized: true,
  })
);

// ------- DATABASE SETUP -------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create shipments table if not exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        tracking TEXT UNIQUE NOT NULL,
        sender TEXT,
        receiver TEXT,
        status TEXT,
        security_level TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database ready: shipments table confirmed.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
})();

// ------- AUTH -------
const ADMIN_USER = "0silver";
const ADMIN_PASS = "Silverboss112277";

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    req.session.user = username;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Invalid username or password" });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Protect admin page
app.use("/admin.html", (req, res, next) => {
  if (!req.session || !req.session.loggedIn)
    return res.redirect("/login.html");
  next();
});

// ------- DATABASE HELPERS -------
async function addShipment({ tracking, sender, receiver, status, securityLevel }) {
  await pool.query(
    `INSERT INTO shipments (tracking, sender, receiver, status, security_level)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tracking) DO UPDATE SET
       sender = EXCLUDED.sender,
       receiver = EXCLUDED.receiver,
       status = EXCLUDED.status,
       security_level = EXCLUDED.security_level,
       last_updated = CURRENT_TIMESTAMP`,
    [tracking, sender, receiver, status, securityLevel]
  );
}

async function getShipment(tracking) {
  const result = await pool.query("SELECT * FROM shipments WHERE tracking = $1", [tracking]);
  return result.rows[0];
}

async function updateShipmentStatus(tracking, status) {
  await pool.query(
    `UPDATE shipments SET status=$2, last_updated=CURRENT_TIMESTAMP WHERE tracking=$1`,
    [tracking, status]
  );
}

// ------- ADD SHIPMENT -------
app.post("/add-shipment", async (req, res) => {
  if (!req.session || !req.session.loggedIn)
    return res.status(403).json({ error: "Unauthorized" });

  const { tracking, sender, receiver, status, securityLevel } = req.body || {};
  if (!tracking || !sender || !receiver || !securityLevel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await addShipment({ tracking, sender, receiver, status, securityLevel });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error adding shipment:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------- UPDATE SHIPMENT STATUS -------
app.post("/update-status", async (req, res) => {
  if (!req.session || !req.session.loggedIn)
    return res.status(403).json({ error: "Unauthorized" });

  const { tracking, status } = req.body || {};
  if (!tracking || !status)
    return res.json({ success: false, message: "Missing fields" });

  try {
    await updateShipmentStatus(tracking, status);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error updating shipment:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ------- TRACK SHIPMENT -------
app.get("/track/:tn", async (req, res) => {
  const tn = (req.params.tn || "").trim();
  try {
    const shipment = await getShipment(tn);
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    const responseData = {
      tracking: shipment.tracking,
      sender: shipment.sender,
      receiver: shipment.receiver,
      status: shipment.status,
      securityLevel: shipment.security_level,
      lastUpdated: shipment.last_updated,
    };

    res.json(responseData);
  } catch (err) {
    console.error("❌ Error fetching shipment:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// ------- HEALTH CHECK (keep this small and fast) -------
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// ------- HEALTH CHECK -------
app.get("/ping", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ------- HOMEPAGE -------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "tracking.html"));
});

// ------- START SERVER -------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Brinks Tracking Server running on port ${PORT}`);
});