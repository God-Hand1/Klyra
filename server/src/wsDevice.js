const url = require("url");
const { WebSocketServer } = require("ws");
const dm = require("./deviceManager");

/** @type {Map<string, import('ws').WebSocket>} deviceId → ws */
const deviceSockets = new Map();

/**
 * Attach the device WebSocket endpoint to an HTTP server.
 */
function init(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;
    if (pathname !== "/ws/device") return; // let other upgraders handle it

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws, req) => {
    const params = new URLSearchParams(url.parse(req.url).query);
    const deviceId = params.get("deviceId");

    if (!deviceId) {
      ws.close(4000, "Missing deviceId");
      return;
    }

    console.log(`[ws/device] connected: ${deviceId}`);
    deviceSockets.set(deviceId, ws);
    dm.markOnline(deviceId);

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      switch (msg.type) {
        case "status_report":
          dm.applyStatusReport(deviceId, msg);
          break;

        case "command_result":
          dm.applyCommandResult(deviceId, msg);
          break;

        default:
          console.log(`[ws/device] unknown message type: ${msg.type}`);
      }
    });

    ws.on("close", () => {
      console.log(`[ws/device] disconnected: ${deviceId}`);
      deviceSockets.delete(deviceId);
      dm.markOffline(deviceId);
    });

    ws.on("error", (err) => {
      console.error(`[ws/device] error (${deviceId}):`, err.message);
    });
  });

  return wss;
}

/**
 * Send a command object to a connected device.
 * Returns true if the device was online and the message was sent.
 */
function sendToDevice(deviceId, command) {
  const ws = deviceSockets.get(deviceId);
  if (!ws || ws.readyState !== 1) return false;
  ws.send(JSON.stringify(command));
  return true;
}

module.exports = { init, sendToDevice, deviceSockets };
