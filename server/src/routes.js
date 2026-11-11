const { Router } = require("express");
const { signToken, authMiddleware } = require("./auth");
const dm = require("./deviceManager");
const apps = require("../data");

const router = Router();

// ── Login ──────────────────────────────────────────────────────────────

router.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = signToken({ username });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// ── App catalog ────────────────────────────────────────────────────────

router.get("/api/apps", (req, res) => {
  res.json(apps);
});

// ── Device state ───────────────────────────────────────────────────────

router.get("/api/devices", (req, res) => {
  res.json(dm.getAllDevices());
});

module.exports = router;
