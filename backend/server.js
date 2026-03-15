/* ================================================
   CityNexus — Node.js Express Backend
   Full-stack: MongoDB + Gemini AI + Static Serving
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
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Models ──────────────────────────────────────────────────────────
const Incident = require("./models/Incident");
const SOSAlert = require("./models/SOSAlert");
const Detection = require("./models/Detection");
const ContactMessage = require("./models/ContactMessage");

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// ── Gemini AI Initialization ────────────────────────────────────────
let geminiModel = null;
let geminiVisionModel = null;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log("[CityNexus] ✓ Gemini AI initialized");
} else {
  console.warn("[CityNexus] ⚠ GEMINI_API_KEY not set — AI features disabled");
}
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/citynexus";

// ── MongoDB Connection (optimized for serverless) ───────────────────
// Cache the connection PROMISE (not just the result) so concurrent
// cold-start requests share the same in-flight connection attempt.
let cachedPromise = null;

async function connectDB() {
  // Already connected — reuse immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection in progress — reuse the same promise
  if (cachedPromise) {
    return cachedPromise;
  }

  // New connection — cache the promise
  cachedPromise = mongoose.connect(MONGO_URI, {
    bufferCommands: false,
    maxPoolSize: 5,               // limit connections (free tier friendly)
    minPoolSize: 1,               // keep at least 1 alive
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,         // close idle connections after 30s
  }).then((conn) => {
    console.log("[CityNexus] ✓ MongoDB connected");
    return conn;
  }).catch((err) => {
    console.error("[CityNexus] ✗ MongoDB failed:", err.message);
    cachedPromise = null;         // reset so next request retries
    throw err;
  });

  return cachedPromise;
}

// Connect eagerly (for local dev) and ensure connection middleware (for serverless)
connectDB().catch(() => {});

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Continue anyway — individual routes will handle DB errors
  }
  next();
});

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files from the project root
app.use(express.static(path.join(__dirname, "..")));

// ── Multer setup — temp storage (/tmp for serverless, /uploads for local)
const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, "uploads");
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

  const aiStatus = geminiModel ? "Gemini AI ready" : "no API key";

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
  if (!geminiModel) {
    return res.status(503).json({ ai_service: "unavailable", error: "GEMINI_API_KEY not configured" });
  }
  try {
    const result = await geminiModel.generateContent("Say OK");
    res.json({ ai_service: "Gemini AI", status: "operational", model: "gemini-2.0-flash" });
  } catch (err) {
    res.status(503).json({ ai_service: "error", error: err.message });
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
//  ACCIDENT DETECTION — Gemini Vision AI
// ─────────────────────────────────────────────────────────────────────

app.post("/api/detect", upload.single("image"), async (req, res) => {
  const filePath = req.file ? req.file.path : null;

  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded. Send multipart/form-data with field 'image'.",
    });
  }

  if (!geminiVisionModel) {
    cleanupFile(filePath);
    return res.status(503).json({
      error: "Gemini AI not configured. Set GEMINI_API_KEY in .env",
    });
  }

  try {
    // Read image as base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype;

    // Build Gemini Vision prompt
    const prompt = `You are a traffic and accident detection AI system. Analyze this image carefully.

Respond ONLY with valid JSON (no markdown, no code fences). Use this exact format:
{
  "count": <number of objects detected>,
  "hasAccident": <true or false>,
  "severity": "<none|minor|moderate|severe|critical>",
  "summary": "<one-line description of the scene>",
  "detections": [
    {
      "label": "<object name like car, truck, accident, person, traffic_jam>",
      "confidence": <0.0 to 1.0>,
      "bbox": [<x_percent>, <y_percent>, <width_percent>, <height_percent>]
    }
  ]
}

Rules:
- Detect vehicles, pedestrians, accidents, traffic jams, damaged vehicles
- If there is an accident or collision, set hasAccident=true and assign severity
- bbox values should be rough percentage estimates (0-100) of position in the image
- confidence should reflect how certain you are about each detection
- Always return at least the overall scene description in summary`;

    // Send to Gemini Vision
    const result = await geminiVisionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text();

    // Parse JSON from Gemini response (handle potential markdown wrapping)
    let aiData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseErr) {
      console.error("[detect] Gemini JSON parse error:", parseErr.message);
      console.error("[detect] Raw response:", responseText);
      aiData = {
        count: 0,
        hasAccident: false,
        severity: "none",
        summary: responseText.substring(0, 200),
        detections: [],
      };
    }

    // Ensure required fields exist
    aiData.count = aiData.count || (aiData.detections ? aiData.detections.length : 0);
    aiData.hasAccident = aiData.hasAccident || false;
    aiData.detections = aiData.detections || [];
    aiData.severity = aiData.severity || "none";

    // Save detection to database
    try {
      await Detection.create({
        filename: req.file.originalname,
        detections: aiData.detections,
        count: aiData.count,
        hasAccident: aiData.hasAccident,
        sosTriggered: aiData.hasAccident && (aiData.severity === "severe" || aiData.severity === "critical"),
      });
    } catch (dbErr) {
      console.error("[detect] DB save failed (non-fatal):", dbErr.message);
    }

    console.log(`[detect] Gemini analysis: ${aiData.count} objects, accident=${aiData.hasAccident}, severity=${aiData.severity}`);

    // Return AI results to the client
    return res.json(aiData);
  } catch (err) {
    console.error("[detect] Gemini error:", err.message);
    return res.status(500).json({
      error: "Gemini AI analysis failed.",
      details: err.message,
    });
  } finally {
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
//  AI CHAT — Gemini-powered with live city data context
// ─────────────────────────────────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ error: "message is required." });

    // Fetch live stats for context
    const [incidentCount, sosCount, detectionCount, trafficCount, crimeCount, recentIncidents] = await Promise.all([
      Incident.countDocuments(),
      SOSAlert.countDocuments(),
      Detection.countDocuments(),
      Incident.countDocuments({ type: "traffic" }),
      Incident.countDocuments({ type: "crime" }),
      Incident.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const recentList = recentIncidents.map(i => `${i.type} at ${i.location} (${i.status})`).join("; ");

    // If Gemini is available, use it
    if (geminiModel) {
      const systemPrompt = `You are CityNexus Command AI, an intelligent assistant for a smart city monitoring platform. You have access to LIVE city data:

— Total incidents: ${incidentCount}
— Traffic incidents: ${trafficCount}
— Crime incidents: ${crimeCount}
— SOS alerts: ${sosCount}
— AI detections performed: ${detectionCount}
— Recent incidents: ${recentList || "None"}

Rules:
- Keep responses concise (2-4 sentences max)
- Use HTML formatting: <strong>, <br>, <em> for emphasis
- Reference the live data when relevant
- If user mentions SOS/emergency, confirm help is being dispatched
- Be professional but friendly, like a command center operator
- Don't use markdown, only HTML tags`;

      try {
        const chat = geminiModel.startChat({
          history: [
            { role: "user", parts: [{ text: "Initialize" }] },
            { role: "model", parts: [{ text: systemPrompt }] },
          ],
        });

        const result = await chat.sendMessage(message);
        const geminiResponse = result.response.text();

        return res.json({ success: true, response: geminiResponse });
      } catch (geminiErr) {
        console.error("[chat] Gemini error:", geminiErr.message);
        // Fall through to keyword-based fallback
      }
    }

    // Fallback: keyword-based responses with live data
    const lowerMsg = message.toLowerCase();
    let response = "";

    if (lowerMsg.includes("status") || lowerMsg.includes("stats") || lowerMsg.includes("dashboard")) {
      response = `<strong>City Status:</strong><br>📋 ${incidentCount} incident(s)<br>🚨 ${sosCount} SOS alert(s)<br>🔍 ${detectionCount} AI detection(s)<br>All systems operational.`;
    } else if (lowerMsg.includes("incident") || lowerMsg.includes("report")) {
      if (recentIncidents.length > 0) {
        const list = recentIncidents.slice(0, 3).map(i => `• <strong>${i.type}</strong> at ${i.location} — ${i.status}`).join("<br>");
        response = `<strong>Recent Incidents:</strong><br>${list}`;
      } else {
        response = "No incidents reported yet. Use the Incident Report form to file one.";
      }
    } else if (lowerMsg.includes("sos") || lowerMsg.includes("emergency")) {
      response = "Activating Emergency SOS sequence now. Stay calm, help is being dispatched.";
    } else if (lowerMsg.includes("traffic")) {
      response = `Traffic status: <strong>${trafficCount} traffic incident(s)</strong> reported. AI rerouting protocols active.`;
    } else if (lowerMsg.includes("crime")) {
      response = `Crime surveillance: <strong>${crimeCount} crime incident(s)</strong> logged. Police on standby.`;
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
      response = "Hello! I'm CityNexus Command AI powered by <strong>Gemini</strong>. Ask me about <strong>status</strong>, <strong>incidents</strong>, <strong>traffic</strong>, or <strong>crime</strong>.";
    } else {
      response = "I'm CityNexus Command AI. Ask about city <strong>status</strong>, <strong>traffic</strong>, <strong>incidents</strong>, or activate <strong>SOS</strong>.";
    }

    res.json({ success: true, response });
  } catch (err) {
    console.error("[chat] Error:", err.message);
    res.json({
      success: true,
      response: "I encountered an error. Basic commands still work — ask about traffic, crime, or activate the SOS.",
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

// ── Fallback: serve index.html for root (local dev only) ────────────
if (!process.env.VERCEL) {
  app.get("{*path}", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
  });
}

// ── Start server (local dev) / Export for Vercel ────────────────────
if (process.env.VERCEL) {
  module.exports = app;
} else {
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
}
