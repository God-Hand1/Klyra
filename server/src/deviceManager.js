const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "..", "state.json");

/** @type {Map<string, object>} */
const devices = new Map();

/** All connected admin WebSocket clients */
const adminClients = new Set();

// ── Debounced persistence ──────────────────────────────────────────────

let saveTimer = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const obj = Object.fromEntries(devices);
    fs.writeFile(STATE_FILE, JSON.stringify(obj, null, 2), (err) => {
      if (err) console.error("[state] write error:", err.message);
    });
  }, 1000);
}

function flushState() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    const obj = Object.fromEntries(devices);
    fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error("[state] synchronous flush error:", err.message);
  }
}

// ── Broadcast to admin clients ─────────────────────────────────────────

function broadcastToAdmins() {
  const payload = JSON.stringify({
    type: "devices_update",
    devices: Object.fromEntries(devices),
  });
  for (const ws of adminClients) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(payload);
    }
  }
}

function broadcastCommandResult({ deviceId, commandId, success, message }) {
  const payload = JSON.stringify({
    type: "command_result",
    deviceId,
    commandId,
    success: Boolean(success),
    message: message || "",
  });
  for (const ws of adminClients) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(payload);
    }
  }
}

// ── Public helpers ─────────────────────────────────────────────────────

/** Notify state changed — persist + broadcast. */
function onStateChange() {
  scheduleSave();
  broadcastToAdmins();
}

function getDevice(deviceId) {
  return devices.get(deviceId);
}

function getAllDevices() {
  return Object.fromEntries(devices);
}

function setDevice(deviceId, state) {
  devices.set(deviceId, state);
  onStateChange();
}

/**
 * Mark a device online, creating a skeleton entry if it doesn't exist yet.
 */
function markOnline(deviceId) {
  let dev = devices.get(deviceId);
  if (!dev) {
    dev = {
      deviceId,
      deviceName: "",
      model: "",
      androidVersion: "",
      online: true,
      lastSeen: new Date().toISOString(),
      installedApps: [],
      pendingCommands: [],
    };
    devices.set(deviceId, dev);
  } else {
    dev.online = true;
    dev.lastSeen = new Date().toISOString();
  }
  onStateChange();
  return dev;
}

function markOffline(deviceId) {
  const dev = devices.get(deviceId);
  if (dev) {
    dev.online = false;
    dev.lastSeen = new Date().toISOString();
    onStateChange();
  }
}

/**
 * Apply a full status report from a device — replaces RAM state for it.
 */
function applyStatusReport(deviceId, report) {
  const existing = devices.get(deviceId);
  const dev = {
    deviceId,
    deviceName: report.deviceName || "",
    model: report.model || "",
    androidVersion: report.androidVersion || "",
    online: true,
    lastSeen: new Date().toISOString(),
    installedApps: report.installedApps || [],
    pendingCommands: existing ? existing.pendingCommands : [],
  };
  devices.set(deviceId, dev);
  onStateChange();
}

const MAX_COMMAND_HISTORY = 100;

/**
 * Record the result of a command on a device and broadcast to admins.
 */
function applyCommandResult(deviceId, { commandId, success, message }) {
  const dev = devices.get(deviceId);
  if (dev) {
    const cmd = dev.pendingCommands.find((c) => c.commandId === commandId);
    if (cmd) {
      cmd.status = success ? "success" : "failed";
      cmd.message = message || "";
    } else if (commandId) {
      dev.pendingCommands.push({
        commandId,
        type: "device_action",
        status: success ? "success" : "failed",
        message: message || "",
        sentAt: new Date().toISOString(),
      });
      if (dev.pendingCommands.length > MAX_COMMAND_HISTORY) {
        dev.pendingCommands = dev.pendingCommands.slice(-MAX_COMMAND_HISTORY);
      }
    }
  }
  onStateChange();
  broadcastCommandResult({ deviceId, commandId, success, message });
}

/**
 * Push a pending command onto a device's list.
 */
function addPendingCommand(deviceId, command) {
  const dev = devices.get(deviceId);
  if (!dev) return;
  dev.pendingCommands.push({
    ...command,
    status: "pending",
    sentAt: new Date().toISOString(),
  });
  if (dev.pendingCommands.length > MAX_COMMAND_HISTORY) {
    dev.pendingCommands = dev.pendingCommands.slice(-MAX_COMMAND_HISTORY);
  }
  onStateChange();
}

/**
 * Get all queued commands awaiting delivery for a device.
 */
function getQueuedCommands(deviceId) {
  const dev = devices.get(deviceId);
  if (!dev) return [];
  return dev.pendingCommands.filter((c) => c.status === "pending");
}

// ── Load hint from disk on startup ─────────────────────────────────────

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      for (const [id, state] of Object.entries(raw)) {
        // Mark all devices offline — they will reconnect and send status_report
        state.online = false;
        devices.set(id, state);
      }
      console.log(`[state] loaded ${devices.size} device(s) from state.json`);
    }
  } catch (err) {
    console.error("[state] failed to load state.json:", err.message);
  }
}

module.exports = {
  adminClients,
  loadState,
  flushState,
  getDevice,
  getAllDevices,
  setDevice,
  markOnline,
  markOffline,
  applyStatusReport,
  applyCommandResult,
  addPendingCommand,
  getQueuedCommands,
  broadcastCommandResult,
};
