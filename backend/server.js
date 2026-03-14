/* ================================================
   CityNexus — Node.js Express Backend
   Full-stack: MongoDB + AI Proxy + Static Serving
   Runs on port 3000
   ================================================ */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const mongoose = require("mongoose");

// ── Models ──────────────────────────────────────────────────────────
const Incident = require("./models/Incident");
const SOSAlert = require("./models/SOSAlert");
const Detection = require("./models/Detection");
const ContactMessage = require("./models/ContactMessage");

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/citynexus";

// ── MongoDB Connection ──────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[CityNexus] ✓ MongoDB connected →", MONGO_URI))
  .catch((err) => {
    console.error("[CityNexus] ✗ MongoDB connection failed:", err.message);
    console.error(
      "[CityNexus]   Make sure MongoDB is running (mongod or MongoDB Compass)."
    );
  });

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files from the project root
app.use(express.static(path.join(__dirname, "..")));

// ── Multer setup — temp storage in /uploads ─────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/gif",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image files (JPEG, PNG, WebP, BMP, GIF) are allowed.")
      );
    }
  },
});

// ── Helper: delete temp file silently ───────────────────────────────
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err)
        console.error("[cleanup] Failed to remove temp file:", err.message);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════════════

// ── Health check ────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

  let aiStatus = "unreachable";
  try {
    await axios.get(`${AI_SERVICE_URL}/`, { timeout: 3000 });
    aiStatus = "reachable";
  } catch (_) {
    /* silent */
  }

  res.json({
    status: "CityNexus Backend Running",
    port: PORT,
    database: dbStatus,
    ai_service: aiStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── AI health relay ─────────────────────────────────────────────────
app.get("/ai/health", async (_req, res) => {
  try {
    const { data } = await axios.get(`${AI_SERVICE_URL}/`);
    res.json({ ai_service: "reachable", ...data });
  } catch (err) {
    res.status(503).json({ ai_service: "unreachable", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  INCIDENT REPORTS
// ─────────────────────────────────────────────────────────────────────

// Create incident
app.post("/api/incidents", async (req, res) => {
  try {
    const { type, location, coordinates, description, urgent } = req.body;

    if (!type || !location || !description) {
      return res
        .status(400)
        .json({ error: "type, location, and description are required." });
    }

    const incident = await Incident.create({
      type,
      location,
      coordinates: coordinates || {},
      description,
      urgent: urgent || false,
    });

    res.status(201).json({ success: true, incident });
  } catch (err) {
    console.error("[incidents] Error:", err.message);
    res.status(500).json({ error: "Failed to save incident." });
  }
});

// Get all incidents (latest first, limit 50)
app.get("/api/incidents", async (_req, res) => {
  try {
    const incidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: incidents.length, incidents });
  } catch (err) {
    console.error("[incidents] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch incidents." });
  }
});

// Update incident status
app.patch("/api/incidents/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!incident)
      return res.status(404).json({ error: "Incident not found." });
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ error: "Failed to update incident." });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  SOS ALERTS
// ─────────────────────────────────────────────────────────────────────

// Create SOS alert
app.post("/api/sos", async (req, res) => {
  try {
    const { coordinates, locationText } = req.body;

    const sos = await SOSAlert.create({
      coordinates: coordinates || {},
      locationText: locationText || "Unknown",
      status: "activated",
    });

    console.log(`[SOS] 🚨 Alert activated — ID: ${sos._id}`);
    res.status(201).json({ success: true, sos });
  } catch (err) {
    console.error("[sos] Error:", err.message);
    res.status(500).json({ error: "Failed to save SOS alert." });
  }
});

// Update SOS status (dispatched / cancelled / resolved)
app.patch("/api/sos/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === "cancelled") update.cancelledAt = new Date();

    const sos = await SOSAlert.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!sos) return res.status(404).json({ error: "SOS alert not found." });
    res.json({ success: true, sos });
  } catch (err) {
    res.status(500).json({ error: "Failed to update SOS alert." });
  }
});

// Get recent SOS alerts
app.get("/api/sos", async (_req, res) => {
  try {
    const alerts = await SOSAlert.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch SOS alerts." });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  ACCIDENT DETECTION — proxy to Python AI + save to DB
// ─────────────────────────────────────────────────────────────────────

app.post("/api/detect", upload.single("image"), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded. Send multipart/form-data with field 'image'.",
    });
  }

  try {
    // Build form-data to forward to Python service
    const form = new FormData();
    form.append("image", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Forward to Python AI microservice
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect`, form, {
      headers: form.getHeaders(),
      timeout: 60000, // 60 s — model inference can be slow first time
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const aiData = aiResponse.data;

    // Save detection to database
    try {
      const hasAccident =
        aiData.detections &&
        aiData.detections.some((d) =>
          d.label.toLowerCase().includes("accident")
        );

      await Detection.create({
        filename: req.file.originalname,
        detections: aiData.detections || [],
        count: aiData.count || 0,
        hasAccident: hasAccident || false,
        sosTriggered: hasAccident || false,
      });
    } catch (dbErr) {
      console.error("[detect] DB save failed (non-fatal):", dbErr.message);
    }

    // Return AI results to the client
    return res.json(aiData);
  } catch (err) {
    console.error("[detect] AI service error:", err.message);

    if (err.response) {
      // Python service returned an error
      return res.status(err.response.status).json(err.response.data);
    }

    return res.status(502).json({
      error:
        "AI service unavailable. Make sure the Python server is running on port 5000.",
      details: err.message,
    });
  } finally {
    // Always clean up the temp file
    cleanupFile(filePath);
  }
});

// Get detection history
app.get("/api/detections", async (_req, res) => {
  try {
    const detections = await Detection.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ success: true, count: detections.length, detections });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch detection history." });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  CONTACT MESSAGES
// ─────────────────────────────────────────────────────────────────────

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "name, email, and message are required." });
    }

    const msg = await ContactMessage.create({
      name,
      email,
      subject: subject || "General Inquiry",
      message,
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    console.error("[contact] Error:", err.message);
    res.status(500).json({ error: "Failed to save message." });
  }
});

// Get all contact messages (latest first)
app.get("/api/contacts", async (_req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contact messages." });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  AI CHAT — Smart responses with live data from DB
// ─────────────────────────────────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ error: "message is required." });

    const lowerMsg = message.toLowerCase();
    let response = "";

    // Fetch real-time stats from database
    if (
      lowerMsg.includes("status") ||
      lowerMsg.includes("stats") ||
      lowerMsg.includes("dashboard") ||
      lowerMsg.includes("overview")
    ) {
      const [incidentCount, sosCount, detectionCount] = await Promise.all([
        Incident.countDocuments(),
        SOSAlert.countDocuments(),
        Detection.countDocuments(),
      ]);
      response = `<strong>City Status Dashboard:</strong><br>📋 ${incidentCount} incident report(s) filed<br>🚨 ${sosCount} SOS alert(s) recorded<br>🔍 ${detectionCount} AI detection(s) performed<br><br>All systems operational.`;
    } else if (
      lowerMsg.includes("incident") ||
      lowerMsg.includes("report")
    ) {
      const recent = await Incident.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
      if (recent.length > 0) {
        const list = recent
          .map(
            (i) =>
              `• <strong>${i.type}</strong> at ${i.location} — ${i.status}`
          )
          .join("<br>");
        response = `<strong>Recent Incidents:</strong><br>${list}`;
      } else {
        response =
          "No incidents have been reported yet. You can file one using the Incident Report form.";
      }
    } else if (lowerMsg.includes("sos") || lowerMsg.includes("emergency")) {
      response =
        "Activating Emergency SOS sequence now. Stay calm, help is being dispatched.";
    } else if (
      lowerMsg.includes("traffic") ||
      lowerMsg.includes("congestion")
    ) {
      const trafficIncidents = await Incident.countDocuments({
        type: "traffic",
      });
      response = `Current traffic status: <strong>${trafficIncidents} traffic incident(s)</strong> reported. AI has initiated dynamic rerouting protocols and adjusted signals.`;
    } else if (lowerMsg.includes("crime") || lowerMsg.includes("police")) {
      const crimeIncidents = await Incident.countDocuments({ type: "crime" });
      response = `Crime surveillance active. <strong>${crimeIncidents} crime incident(s)</strong> logged. Police units are on standby.`;
    } else if (
      lowerMsg.includes("detect") ||
      lowerMsg.includes("accident")
    ) {
      const accidentDetections = await Detection.countDocuments({
        hasAccident: true,
      });
      const totalDetections = await Detection.countDocuments();
      response = `AI Detection System: <strong>${totalDetections}</strong> total analysis performed, <strong>${accidentDetections}</strong> accident(s) detected. Upload an image in the Accident Detection section for real-time analysis.`;
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
      response =
        "Hello! I'm CityNexus Command AI. I can pull <strong>live data</strong> from the city database. Try asking about <strong>status</strong>, <strong>incidents</strong>, <strong>traffic</strong>, or <strong>crime</strong>.";
    } else {
      response =
        "I am CityNexus Command AI. I can now access <strong>live city data</strong>. Ask me about the city <strong>status</strong>, check <strong>traffic</strong>, view recent <strong>incidents</strong>, report an accident, or activate the <strong>SOS</strong>.";
    }

    res.json({ success: true, response });
  } catch (err) {
    console.error("[chat] Error:", err.message);
    res.json({
      success: true,
      response:
        "I encountered an error accessing the database. Basic commands still work — you can ask about traffic, crime, or activate the SOS.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS (aggregated)
// ─────────────────────────────────────────────────────────────────────

app.get("/api/stats", async (_req, res) => {
  try {
    const [incidents, sos, detections, contacts] = await Promise.all([
      Incident.countDocuments(),
      SOSAlert.countDocuments(),
      Detection.countDocuments(),
      ContactMessage.countDocuments(),
    ]);

    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      stats: {
        totalIncidents: incidents,
        totalSOS: sos,
        totalDetections: detections,
        totalContacts: contacts,
      },
      recentIncidents,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ── Multer error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "File too large. Maximum size is 20 MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── Fallback: serve index.html for root ─────────────────────────────
app.get("{*path}", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ── Start server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║        CityNexus — Smart City Backend            ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║  Server   → http://localhost:${PORT}                ║`);
  console.log(`║  Frontend → http://localhost:${PORT}                ║`);
  console.log(`║  AI Svc   → ${AI_SERVICE_URL.padEnd(35)}║`);
  console.log(`║  MongoDB  → ${MONGO_URI.length > 35 ? MONGO_URI.substring(0, 32) + "..." : MONGO_URI.padEnd(35)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
