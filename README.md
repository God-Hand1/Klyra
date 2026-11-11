# Klyra

> Real-time Mobile Device Management (MDM) system consisting of an Android Device Policy Controller (DPC) app, an in-memory Node.js WebSocket orchestration server, and a dark-themed responsive Web Admin Panel.

---

## Architecture Overview

```
                                  ┌─────────────────────────────┐
                                  │       Web Admin Panel       │
                                  │   (Vanilla JS / CSS SPA)    │
                                  └──────────────▲──────────────┘
                                                 │
                                                 │ WebSocket (/ws/admin?token=jwt)
                                                 │ REST (/api/login, /api/apps)
                                                 │
                                  ┌──────────────▼──────────────┐
                                  │     Klyra Node.js Server    │
                                  │  - State in RAM (Map)       │
                                  │  - state.json debounced sync│
                                  │  - Static SPA host          │
                                  └──────────────▲──────────────┘
                                                 │
                                                 │ WebSocket (/ws/device?deviceId=uuid)
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   │                                                           │
     ┌─────────────▼─────────────┐                               ┌─────────────▼─────────────┐
     │      Android Device       │                               │      Android Device       │
     │   com.klyra.mdm (DPC)     │                               │   com.klyra.mdm (DPC)     │
     │ - Device Owner Provisioned│                               │ - Device Owner Provisioned│
     │ - Silent Install/Uninstall│                               │ - Silent Install/Uninstall│
     │ - Persistent BG Service   │                               │ - Persistent BG Service   │
     └───────────────────────────┘                               └───────────────────────────┘
```

---

## 1. Node.js Server (`server/`)

### Key Characteristics
- **Pure In-Memory State**: Device fleet state resides entirely in server RAM. Upon server restart, state initializes empty and is rebuilt dynamically as devices reconnect and broadcast their `status_report`.
- **Zero Stale Assumptions**: What the device reports live is what the admin console displays.
- **`state.json` Backup**: Written on state changes as a cold-start recovery hint.
- **Unified Real-time Synchronization**:
  - Device WebSocket: `ws://<host>:3000/ws/device?deviceId=<uuid>`
  - Admin WebSocket: `ws://<host>:3000/ws/admin?token=<jwt>`
  - Static Hosting: Serves `admin/index.html` directly at root `http://<host>:3000/`.

### Quickstart
```bash
cd server
cp .env.example .env
npm install
npm start
```

Default credentials in `.env.example`:
- **Username**: `admin`
- **Password**: `admin123`
- **Port**: `3000`

---

## 2. Web Admin Panel (`admin/`)

- **Design**: Dark-themed UI (`#0a0a0a` / `#111`) inspired by Linear and Notion with micro-animations and status pulses.
- **Zero Polling**: State and command execution streams directly over WebSocket.
- **Fleet Controls**:
  - Live device health and hardware specifications.
  - Silent remote APK installation from catalog (`data.js`).
  - Silent uninstallation of managed apps.
  - App freezing (disable/enable via Device Policy Manager).
  - Remote shell command and script execution with streaming terminal output.

Access at `http://localhost:3000/` after starting the server.

---

## 3. Android DPC App (`app/`)

### Tech Stack
- Kotlin + Jetpack Compose + Material Design 3 (Dark/Light).
- Coroutines, OkHttp (WebSocket), Gson, WorkManager, Coil.
- Target SDK: 34, Min SDK: 26.

### Device Owner Provisioning
To enable silent installation and freezing without user prompts, the app must be provisioned as **Device Owner**:

```bash
# Provision Klyra as Device Owner via ADB (device must have no accounts configured)
adb shell dpm set-device-owner com.klyra.mdm/.admin.DeviceAdminReceiver
```

### Background Persistence
- Foreground Service (`KlyraService`) with ongoing notification and `START_STICKY`.
- Battery optimization ignore intent (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).
- `BootReceiver` restores WebSocket connection on reboot (`BOOT_COMPLETED`).
- Periodic `WorkManager` watchdog ensures the background worker remains running.
- Auto-reconnect engine with exponential backoff (1s to 30s).

### Clean Teardown Guarantee
When Klyra's Device Admin is disabled or Klyra is uninstalled, `DeviceAdminReceiver.onDisabled()` triggers an automated purge, uninstallation of all managed packages that were installed through Klyra.

---

## 4. Cross-Component WebSocket Protocol

### Device -> Server
- `status_report`:
  ```json
  {
    "type": "status_report",
    "deviceId": "uuid",
    "deviceName": "Pixel 8",
    "model": "Google Pixel 8",
    "androidVersion": "14",
    "installedApps": [
      { "packageName": "com.example.app", "appName": "Example", "enabled": true, "installedAt": "2026-11-11T00:00:00.000Z" }
    ]
  }
  ```
- `command_result`:
  ```json
  {
    "type": "command_result",
    "commandId": "cmd-123",
    "success": true,
    "message": "Output or status message"
  }
  ```

### Admin -> Server -> Device
- `install_app`: `{ "type": "install_app", "commandId": "...", "packageName": "...", "appName": "...", "apkUrl": "..." }`
- `uninstall_app`: `{ "type": "uninstall_app", "commandId": "...", "packageName": "..." }`
- `disable_app`: `{ "type": "disable_app", "commandId": "...", "packageName": "..." }`
- `enable_app`: `{ "type": "enable_app", "commandId": "...", "packageName": "..." }`
- `run_command`: `{ "type": "run_command", "commandId": "...", "command": "ls -la" }`
- `run_script`: `{ "type": "run_script", "commandId": "...", "script": "echo Hello from Klyra" }`
