const { Router } = require("express");
const { signToken, authMiddleware } = require("./auth");
const dm = require("./deviceManager");
const apps = require("../data");

const router = Router();

// ── Login ──────────────────────────────────────────────────────────────

router.post("/api/login", (req, res) => {
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
    const token = signToken({ username });
    return res.json({ token });
  }

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
