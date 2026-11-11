const { Router } = require("express");
const { signToken, authMiddleware } = require("./auth");
const dm = require("./deviceManager");
const apps = require("../data");

const router = Router();

// ── In-memory rate limiting for login ─────────────────────────────────

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000;

function isLoginRateLimited(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) return false;
  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  // Bound memory: prune expired records if map exceeds 1000 entries
  if (loginAttempts.size > 1000) {
    for (const [key, val] of loginAttempts.entries()) {
      if (now > val.resetAt) loginAttempts.delete(key);
    }
  }
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    record.count++;
  }
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// ── Login ──────────────────────────────────────────────────────────────

router.post("/api/login", (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";

  if (isLoginRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Too many failed login attempts. Please try again later.",
    });
  }

  const { username, password } = req.body || {};

  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;

  if (
    typeof expectedUser === "string" &&
    expectedUser.length > 0 &&
    typeof expectedPass === "string" &&
    expectedPass.length > 0 &&
    username === expectedUser &&
    password === expectedPass
  ) {
    clearLoginAttempts(clientIp);
    const token = signToken({ username });
    return res.json({ token });
  }

  recordFailedAttempt(clientIp);
  return res.status(401).json({ error: "Invalid credentials" });
});

// ── App catalog ────────────────────────────────────────────────────────

router.get("/api/apps", (req, res) => {
  res.json(apps);
});

// ── Device state (protected) ───────────────────────────────────────────

router.get("/api/devices", authMiddleware, (req, res) => {
  res.json(dm.getAllDevices());
});

module.exports = router;
