const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");

process.env.ADMIN_USER = "adminuser";
process.env.ADMIN_PASS = "adminpass123";
process.env.JWT_SECRET = "supersecretjwtkeyforroutes32chars";

const routes = require("../src/routes");
const { signToken } = require("../src/auth");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  app.get("/health", (_req, res) => res.json({ ok: true }));
  return app;
}

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request(
      {
        host: "127.0.0.1",
        port: address.port,
        path,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body ? JSON.parse(body) : null,
            });
          } catch {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body,
            });
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

describe("REST API Routes", () => {
  let server;

  beforeEach((_, done) => {
    const app = createTestApp();
    server = app.listen(0, "127.0.0.1", done);
  });

  afterEach((_, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it("GET /health should return ok: true", async () => {
    const res = await request(server, "/health");
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.ok, true);
  });

  it("POST /api/login should reject empty body (prevent undefined auth bypass)", async () => {
    const res = await request(server, "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, "Invalid credentials");
  });

  it("POST /api/login should reject invalid credentials", async () => {
    const res = await request(server, "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { username: "adminuser", password: "wrongpassword" },
    });
    assert.strictEqual(res.statusCode, 401);
  });

  it("POST /api/login should authenticate valid admin credentials", async () => {
    const res = await request(server, "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { username: "adminuser", password: "adminpass123" },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.token);
  });

  it("GET /api/apps should return catalog without requiring admin token", async () => {
    const res = await request(server, "/api/apps");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
  });

  it("GET /api/devices should be protected and return 401 without Bearer token", async () => {
    const res = await request(server, "/api/devices");
    assert.strictEqual(res.statusCode, 401);
  });

  it("GET /api/devices should return device state with valid Bearer token", async () => {
    const token = signToken({ username: "adminuser" });
    const res = await request(server, "/api/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(typeof res.body === "object");
  });
});
