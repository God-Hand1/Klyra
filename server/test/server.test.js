const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// Set test environment variables
process.env.ADMIN_USER = "testadmin";
process.env.ADMIN_PASS = "testsecret123";
process.env.JWT_SECRET = "test-jwt-secret-key-32charslong";

const { signToken, verifyToken, authMiddleware } = require("../src/auth");
const dm = require("../src/deviceManager");

describe("Authentication Module", () => {
  it("should sign and verify valid JWT tokens", () => {
    const payload = { username: "testadmin" };
    const token = signToken(payload);
    assert.ok(typeof token === "string" && token.length > 0);

    const decoded = verifyToken(token);
    assert.ok(decoded);
    assert.strictEqual(decoded.username, "testadmin");
  });

  it("should return null for invalid or tampered tokens", () => {
    assert.strictEqual(verifyToken("invalid.token.here"), null);
    assert.strictEqual(verifyToken(""), null);
  });

  it("authMiddleware should reject requests without Authorization header", () => {
    const req = { headers: {} };
    let status = null;
    let json = null;
    const res = {
      status: (code) => {
        status = code;
        return { json: (data) => { json = data; } };
      },
    };
    let calledNext = false;
    const next = () => { calledNext = true; };

    authMiddleware(req, res, next);
    assert.strictEqual(status, 401);
    assert.strictEqual(calledNext, false);
  });

  it("authMiddleware should reject requests with invalid Bearer token", () => {
    const req = { headers: { authorization: "Bearer bogus-token" } };
    let status = null;
    const res = {
      status: (code) => {
        status = code;
        return { json: () => {} };
      },
    };
    let calledNext = false;
    authMiddleware(req, res, () => { calledNext = true; });
    assert.strictEqual(status, 401);
    assert.strictEqual(calledNext, false);
  });

  it("authMiddleware should allow requests with valid Bearer token", () => {
    const token = signToken({ username: "testadmin" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let calledNext = false;
    authMiddleware(req, {}, () => { calledNext = true; });
    assert.strictEqual(calledNext, true);
    assert.strictEqual(req.user.username, "testadmin");
  });
});

describe("DeviceManager Module", () => {
  const testDeviceId = "test-device-uuid-123";

  it("should mark device online and offline correctly", () => {
    dm.markOnline(testDeviceId);
    let dev = dm.getDevice(testDeviceId);
    assert.ok(dev);
    assert.strictEqual(dev.online, true);

    dm.markOffline(testDeviceId);
    dev = dm.getDevice(testDeviceId);
    assert.strictEqual(dev.online, false);
  });

  it("should apply status reports correctly", () => {
    dm.applyStatusReport(testDeviceId, {
      deviceName: "Pixel Test",
      model: "Google Pixel Test",
      androidVersion: "14",
      installedApps: [{ packageName: "com.test.app", appName: "Test App", enabled: true }],
    });

    const dev = dm.getDevice(testDeviceId);
    assert.strictEqual(dev.deviceName, "Pixel Test");
    assert.strictEqual(dev.model, "Google Pixel Test");
    assert.strictEqual(dev.androidVersion, "14");
    assert.strictEqual(dev.online, true);
    assert.strictEqual(dev.installedApps.length, 1);
    assert.strictEqual(dev.installedApps[0].packageName, "com.test.app");
  });

  it("should add pending command and cap history at 100 items", () => {
    for (let i = 0; i < 120; i++) {
      dm.addPendingCommand(testDeviceId, {
        commandId: `cmd-${i}`,
        type: "run_command",
        command: `echo ${i}`,
      });
    }

    const dev = dm.getDevice(testDeviceId);
    assert.strictEqual(dev.pendingCommands.length, 100);
    assert.strictEqual(dev.pendingCommands[0].commandId, "cmd-20");
    assert.strictEqual(dev.pendingCommands[99].commandId, "cmd-119");
  });

  it("should apply command result to existing pending command", () => {
    dm.addPendingCommand(testDeviceId, {
      commandId: "exec-test-1",
      type: "run_command",
      command: "uptime",
    });

    dm.applyCommandResult(testDeviceId, {
      commandId: "exec-test-1",
      success: true,
      message: "load average: 0.05",
    });

    const dev = dm.getDevice(testDeviceId);
    const cmd = dev.pendingCommands.find((c) => c.commandId === "exec-test-1");
    assert.ok(cmd);
    assert.strictEqual(cmd.status, "success");
    assert.strictEqual(cmd.message, "load average: 0.05");
  });

  it("should record device-initiated action if commandId not in queue", () => {
    dm.applyCommandResult(testDeviceId, {
      commandId: "device-local-cmd",
      success: true,
      message: "Local action completed",
    });

    const dev = dm.getDevice(testDeviceId);
    const cmd = dev.pendingCommands.find((c) => c.commandId === "device-local-cmd");
    assert.ok(cmd);
    assert.strictEqual(cmd.type, "device_action");
    assert.strictEqual(cmd.status, "success");
  });

  it("should return queued commands awaiting delivery", () => {
    const queueDeviceId = "queue-test-device";
    dm.markOnline(queueDeviceId);
    dm.addPendingCommand(queueDeviceId, { commandId: "q-1", type: "run_command" });
    dm.addPendingCommand(queueDeviceId, { commandId: "q-2", type: "install_app" });

    const queued = dm.getQueuedCommands(queueDeviceId);
    assert.strictEqual(queued.length, 2);
    assert.strictEqual(queued[0].commandId, "q-1");
    assert.strictEqual(queued[1].commandId, "q-2");

    dm.applyCommandResult(queueDeviceId, { commandId: "q-1", success: true, message: "Done" });
    const remaining = dm.getQueuedCommands(queueDeviceId);
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].commandId, "q-2");
  });
});
