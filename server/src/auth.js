const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "fallback-secret" ||
    process.env.JWT_SECRET === "change-me-to-a-random-secret")
) {
  throw new Error(
    "[SECURITY CRITICAL] Set a secure, random JWT_SECRET in environment before running in production!"
  );
}
const TOKEN_EXPIRY = "24h";

/**
 * Create a signed JWT for an authenticated admin.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT. Returns the decoded payload or null.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Express middleware — rejects requests without a valid Bearer token.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const decoded = verifyToken(header.slice(7));
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = decoded;
  next();
}

module.exports = { signToken, verifyToken, authMiddleware };
