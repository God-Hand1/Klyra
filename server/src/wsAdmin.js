const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const { verifyToken } = require("./auth");
const dm = require("./deviceManager");
const wsDevice = require("./wsDevice");

/**
 * Attach the admin WebSocket endpoint to an HTTP server.
 */
function init(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, searchParams } = new URL(req.url, "http://localhost");
    if (pathname !== "/ws/admin") return;

    // Authenticate before upgrading
    const token = searchParams.get("token");
    if (!token || !verifyToken(token)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    console.log("[ws/admin] admin connected");
    dm.adminClients.add(ws);

    // Send current full state on connect
    ws.send(
      JSON.stringify({
        type: "devices_update",
        devices: dm.getAllDevices(),
      })
    );

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === "send_command") {
        const { deviceId, command } = msg;
        if (!deviceId || !command || !command.type) {
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid command payload" })
          );
          return;
        }

        const commandId = uuidv4();
        const fullCommand = { commandId, ...command };

        // Track it on the device
        dm.addPendingCommand(deviceId, fullCommand);

        // Forward to the device
        const sent = wsDevice.sendToDevice(deviceId, fullCommand);

        ws.send(
          JSON.stringify({
            type: "command_ack",
            commandId,
            deviceId,
            delivered: sent,
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("[ws/admin] admin disconnected");
      dm.adminClients.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("[ws/admin] error:", err.message);
    });
  });

  return wss;
}

module.exports = { init };
