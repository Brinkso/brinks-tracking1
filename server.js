const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require("express-session");

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

const DATA_FILE = path.join(__dirname, "shipments.json");

// Read and write shipment data
function readShipments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (e) {
    console.error("❌ Error reading shipments.json:", e);
    return [];
  }
}

function writeShipments(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ Error writing shipments.json:", e);
  }
}

// Admin credentials
const ADMIN_USER = "0silver";
const ADMIN_PASS = "Silverboss112277";

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    req.session.user = username;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Invalid username or password" });
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Protect admin page
app.use("/admin.html", (req, res, next) => {
  if (!req.session || !req.session.loggedIn)
    return res.redirect("/login.html");
  next();
});

// Add new shipment
app.post("/add-shipment", (req, res) => {
  if (!req.session || !req.session.loggedIn)
    return res.status(403).json({ error: "Unauthorized" });

  const { tracking, sender, receiver, status, securityLevel } = req.body || {};
  if (!tracking || !sender || !receiver || !securityLevel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const shipments = readShipments();
  const now = new Date();
  const formattedTime = now.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const newShipment = {
    tracking,
    sender,
    receiver,
    status: status || "In Secure Transit",
    securityLevel,
    lastUpdated: formattedTime,
  };

  shipments.push(newShipment);
  writeShipments(shipments);
  res.json({ success: true, shipment: newShipment });
});

// Update shipment
app.post("/update-status", (req, res) => {
  if (!req.session || !req.session.loggedIn)
    return res.status(403).json({ error: "Unauthorized" });

  const { tracking, status } = req.body || {};
  if (!tracking || !status)
    return res.json({ success: false, message: "Missing fields" });

  const shipments = readShipments();
  const shipment = shipments.find((s) => s.tracking === tracking);
  if (!shipment)
    return res.json({ success: false, message: "Shipment not found" });

  const now = new Date();
  const formattedTime = now.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  shipment.status = status;
  shipment.lastUpdated = formattedTime;
  writeShipments(shipments);
  res.json({ success: true });
});

// Tracking route
app.get("/track/:tn", (req, res) => {
  const tn = (req.params.tn || "").trim();
  const shipments = readShipments();
  const shipment = shipments.find((s) => s.tracking === tn);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  res.json({
    tracking: shipment.tracking || "N/A",
    sender: shipment.sender || "N/A",
    receiver: shipment.receiver || "N/A",
    status: shipment.status || "Pending",
    securityLevel: shipment.securityLevel || "Standard",
    lastUpdated: shipment.lastUpdated || "Not updated yet",
  });
});

// Health check (for Render)
app.get("/ping", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Default page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "tracking.html"));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Brinks Tracking Server running on port ${PORT}`);
});