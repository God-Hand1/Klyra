require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
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
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Basic production security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Serve static files for admin SPA
app.use(express.static(path.resolve(__dirname, "../../admin")));

app.use(routes);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── HTTP + WebSocket server ────────────────────────────────────────────

const server = http.createServer(app);

// Attach WebSocket handlers (both use the same HTTP server via noServer)
wsDevice.init(server);
wsAdmin.init(server);

// Reject unknown upgrade paths to avoid socket resource leaks
server.on("upgrade", (req, socket) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname !== "/ws/device" && pathname !== "/ws/admin") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
  }
});

// ── Load persisted state hint, then start ──────────────────────────────

dm.loadState();

server.listen(PORT, () => {
  console.log(`[klyra] server listening on http://localhost:${PORT}`);
  console.log(`[klyra] device WS  → ws://localhost:${PORT}/ws/device?deviceId=xxx`);
  console.log(`[klyra] admin  WS  → ws://localhost:${PORT}/ws/admin?token=xxx`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────

function handleShutdown(signal) {
  console.log(`[klyra] received ${signal}, flushing state and closing...`);
  dm.flushState();
  server.close(() => {
    console.log("[klyra] HTTP and WS servers closed cleanly");
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
