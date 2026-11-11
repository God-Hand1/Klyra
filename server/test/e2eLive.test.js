const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { WebSocket } = require("ws");

process.env.ADMIN_USER = "e2eadmin";
process.env.ADMIN_PASS = "e2epassword123";
process.env.JWT_SECRET = "e2e-jwt-secret-very-secure-32chars!";

const { signToken } = require("../src/auth");
const routes = require("../src/routes");
const dm = require("../src/deviceManager");
const wsDevice = require("../src/wsDevice");
const wsAdmin = require("../src/wsAdmin");

describe("End-to-End Platform Integration Test", () => {
  let server;
  let port;
  let adminToken;

  before((_, done) => {
    adminToken = signToken({ username: "e2eadmin" });

    const app = express();
    app.use(express.json());
    app.use(routes);

    server = http.createServer(app);
    wsDevice.init(server);
    wsAdmin.init(server);

    server.on("upgrade", (req, socket) => {
      const { pathname } = new URL(req.url, "http://localhost");
      if (pathname !== "/ws/device" && pathname !== "/ws/admin") {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.destroy();
      }
    });

    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      done();
    });
  });

  after((_, done) => {
    dm.flushState();
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it("should complete full device & admin command lifecycle via real WebSockets", async () => {
    const deviceId = "android-device-e2e-1";

    // 1. Admin connects to /ws/admin
    const adminWs = new WebSocket(`ws://127.0.0.1:${port}/ws/admin?token=${adminToken}`);

    const adminMessages = [];
    adminWs.on("message", (raw) => {
      adminMessages.push(JSON.parse(raw));
    });

    await new Promise((resolve) => adminWs.on("open", resolve));
    assert.strictEqual(adminWs.readyState, WebSocket.OPEN);

    // Initial state sent on connect
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(adminMessages.length >= 1);
    assert.strictEqual(adminMessages[0].type, "devices_update");

    // 2. Simulated Android Device connects to /ws/device
    let deviceWs = new WebSocket(`ws://127.0.0.1:${port}/ws/device?deviceId=${deviceId}`);
    const deviceMessages = [];
    deviceWs.on("message", (raw) => {
      deviceMessages.push(JSON.parse(raw));
    });

    await new Promise((resolve) => deviceWs.on("open", resolve));
    assert.strictEqual(deviceWs.readyState, WebSocket.OPEN);

    // 3. Device sends status report
    deviceWs.send(
      JSON.stringify({
        type: "status_report",
        deviceName: "Pixel 8 Pro",
        model: "Pixel 8 Pro",
        androidVersion: "14",
        installedApps: [
          { packageName: "com.example.test", appName: "Test App", enabled: true },
        ],
      })
    );

    await new Promise((r) => setTimeout(r, 100));

    // Verify device in deviceManager
    const storedDev = dm.getDevice(deviceId);
    assert.ok(storedDev);
    assert.strictEqual(storedDev.online, true);
    assert.strictEqual(storedDev.deviceName, "Pixel 8 Pro");
    assert.strictEqual(storedDev.installedApps.length, 1);

    // 4. Admin sends command to online device
    adminWs.send(
      JSON.stringify({
        type: "send_command",
        deviceId,
        command: {
          type: "install_app",
          packageName: "com.demo.kiosk",
          appName: "Demo Kiosk",
          apkUrl: "https://example.com/kiosk.apk",
        },
      })
    );

    // Wait for delivery
    await new Promise((r) => setTimeout(r, 100));

    // Device should have received the command
    assert.ok(deviceMessages.length >= 1);
    const receivedCmd = deviceMessages[0];
    assert.strictEqual(receivedCmd.type, "install_app");
    assert.strictEqual(receivedCmd.packageName, "com.demo.kiosk");
    assert.ok(receivedCmd.commandId);

    // 5. Device reports command execution result
    deviceWs.send(
      JSON.stringify({
        type: "command_result",
        commandId: receivedCmd.commandId,
        success: true,
        message: "Installed com.demo.kiosk successfully",
      })
    );

    await new Promise((r) => setTimeout(r, 100));

    // Admin should have received command_result broadcast
    const resultMsg = adminMessages.find(
      (m) => m.type === "command_result" && m.commandId === receivedCmd.commandId
    );
    assert.ok(resultMsg, "Admin should receive command_result broadcast");
    assert.strictEqual(resultMsg.success, true);
    assert.strictEqual(resultMsg.message, "Installed com.demo.kiosk successfully");

    // 6. Device disconnects (offline)
    deviceWs.close();
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(dm.getDevice(deviceId).online, false);

    // 7. Admin queues command while device is offline
    adminWs.send(
      JSON.stringify({
        type: "send_command",
        deviceId,
        command: {
          type: "run_command",
          command: "whoami",
        },
      })
    );

    await new Promise((r) => setTimeout(r, 100));

    // Verify command was queued
    const queued = dm.getQueuedCommands(deviceId);
    assert.strictEqual(queued.length, 1);
    assert.strictEqual(queued[0].type, "run_command");

    // 8. Device reconnects and sends status report
    const reconnectedDeviceMessages = [];
    deviceWs = new WebSocket(`ws://127.0.0.1:${port}/ws/device?deviceId=${deviceId}`);
    deviceWs.on("message", (raw) => {
      reconnectedDeviceMessages.push(JSON.parse(raw));
    });

    await new Promise((resolve) => deviceWs.on("open", resolve));

    deviceWs.send(
      JSON.stringify({
        type: "status_report",
        deviceName: "Pixel 8 Pro",
        model: "Pixel 8 Pro",
        androidVersion: "14",
        installedApps: [],
      })
    );

    // Wait for queued command flush
    await new Promise((r) => setTimeout(r, 150));

    // Reconnected device MUST receive the queued offline command!
    assert.ok(
      reconnectedDeviceMessages.length >= 1,
      "Device must receive queued command upon reconnection"
    );
    const flushedCmd = reconnectedDeviceMessages.find((m) => m.type === "run_command");
    assert.ok(flushedCmd);
    assert.strictEqual(flushedCmd.command, "whoami");

    // Cleanup sockets
    deviceWs.close();
    adminWs.close();
  });

  it("should reject unauthenticated WebSocket connections to /ws/admin", async () => {
    const unauthWs = new WebSocket(`ws://127.0.0.1:${port}/ws/admin?token=invalidtoken`);

    let rejected = false;
    unauthWs.on("error", () => {
      rejected = true;
    });

    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(unauthWs.readyState, WebSocket.CLOSED);
  });

  it("should reject WebSocket connections to /ws/device without deviceId", async () => {
    const badDeviceWs = new WebSocket(`ws://127.0.0.1:${port}/ws/device`);

    let closed = false;
    badDeviceWs.on("close", (code) => {
      closed = true;
      assert.strictEqual(code, 4000);
    });

    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(closed, true);
  });
});
