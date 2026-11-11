require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const http = require("http");
const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const dm = require("./deviceManager");
const wsDevice = require("./wsDevice");
const wsAdmin = require("./wsAdmin");

const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Express setup ──────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── HTTP + WebSocket server ────────────────────────────────────────────

const server = http.createServer(app);

// Attach WebSocket handlers (both use the same HTTP server via noServer)
wsDevice.init(server);
wsAdmin.init(server);

// ── Load persisted state hint, then start ──────────────────────────────

dm.loadState();

server.listen(PORT, () => {
  console.log(`[klyra] server listening on http://localhost:${PORT}`);
  console.log(`[klyra] device WS  → ws://localhost:${PORT}/ws/device?deviceId=xxx`);
  console.log(`[klyra] admin  WS  → ws://localhost:${PORT}/ws/admin?token=xxx`);
});
