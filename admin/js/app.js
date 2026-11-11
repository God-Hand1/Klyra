// ─── App Controller (State + Routing) ───

const App = (() => {
  let currentView = 'dashboard';
  let devices = [];
  let appCatalog = [];
  let connectionStatus = 'disconnected';
  let targetDeviceId = null; // Filter/target for app catalog install
  const deviceOutputs = new Map(); // deviceId -> string console output

  function init() {
    if (!Auth.isLoggedIn()) {
      UI.renderLogin();
      return;
    }
    UI.renderMainLayout();
    navigate('dashboard');
    WS.connect();
    fetchApps();
    fetchDevices();
  }

  async function fetchApps() {
    try {
      const res = await fetch('/api/apps', {
        headers: { 'Authorization': 'Bearer ' + Auth.getToken() }
      });
      if (res.ok) {
        appCatalog = await res.json();
        if (currentView === 'apps') renderCurrentView();
      }
    } catch (e) {
      console.error('Failed to fetch apps:', e);
    }
  }

  async function fetchDevices() {
    try {
      const res = await fetch('/api/devices', {
        headers: { 'Authorization': 'Bearer ' + Auth.getToken() }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          devices = data;
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.devices)) {
            devices = data.devices;
          } else if (data.devices && typeof data.devices === 'object') {
            devices = Object.values(data.devices);
          } else {
            devices = Object.values(data);
          }
        }
        renderCurrentView();
        UI.updateOnlineCount(devices.filter(d => d.online).length);
      }
    } catch (e) {
      console.error('Failed to fetch devices:', e);
    }
  }

  function navigate(view) {
    currentView = view;
    UI.setActiveNav(view);
    renderCurrentView();
  }

  function renderCurrentView() {
    switch (currentView) {
      case 'dashboard':
        UI.renderDashboard(devices);
        break;
      case 'devices':
        UI.renderDevices(devices);
        break;
      case 'apps':
        UI.renderAppCatalog(appCatalog, devices, targetDeviceId);
        break;
      case 'settings':
        UI.renderSettings();
        break;
    }
  }

  // ─── Target Device for App Installation ───
  function openInstallCatalog(deviceId) {
    targetDeviceId = deviceId;
    UI.closeDeviceModal();
    navigate('apps');
  }

  function clearTargetDevice() {
    targetDeviceId = null;
    renderCurrentView();
  }

  // ─── State Updates from WebSocket ───
  function updateDevices(newDevices) {
    if (Array.isArray(newDevices)) {
      devices = newDevices;
    } else if (newDevices && typeof newDevices === 'object') {
      devices = Object.values(newDevices);
    }
    UI.updateOnlineCount(devices.filter(d => d.online).length);
    renderCurrentView();
    UI.refreshDeviceModal();
  }

  function handleCommandAck(data) {
    if (data.delivered === false) {
      UI.toast(`Device ${data.deviceId} is offline — command queued on server`, 'warning');
    } else {
      UI.toast('Command forwarded to device', 'info');
    }
  }

  function handleCommandResult(data) {
    if (data.commandId) {
      devices.forEach(d => {
        (d.pendingCommands || []).forEach(cmd => {
          if (cmd.commandId === data.commandId) {
            cmd.status = data.success ? 'success' : 'failed';
            cmd.message = data.message || '';
          }
        });
      });
      renderCurrentView();
      UI.refreshDeviceModal();
    }

    if (data.deviceId && data.message) {
      appendDeviceOutput(data.deviceId, `[${data.success ? 'OK' : 'ERROR'}] ${data.message}`);
    }

    if (data.success) {
      UI.toast(data.message || 'Command executed successfully', 'success');
    } else {
      UI.toast(data.message || 'Command failed', 'error');
    }
  }

  function setConnectionStatus(status) {
    connectionStatus = status;
    UI.updateConnectionStatus(status);
  }

  function getDevice(deviceId) {
    return devices.find(d => d.deviceId === deviceId);
  }

  function getDevices() {
    return devices;
  }

  function getTargetDeviceId() {
    return targetDeviceId;
  }

  function getDeviceOutput(deviceId) {
    return deviceOutputs.get(deviceId) || 'Ready. Enter a command or script above and click Run.';
  }

  function appendDeviceOutput(deviceId, text) {
    const existing = deviceOutputs.get(deviceId) || '';
    const newOutput = (existing ? existing + '\n' : '') + text;
    deviceOutputs.set(deviceId, newOutput);
    UI.updateModalOutput(newOutput);
  }

  // ─── Device Actions ───
  function installApp(deviceId, packageName, appName, apkUrl) {
    const sent = WS.sendCommand(deviceId, {
      type: 'install_app',
      packageName,
      appName,
      apkUrl,
    });
    if (sent) {
      const device = getDevice(deviceId);
      const name = device ? (device.deviceName || deviceId) : deviceId;
      UI.toast(`Installing ${appName} on ${name}…`, 'info');
      appendDeviceOutput(deviceId, `$ install_app ${packageName}`);
    } else {
      UI.toast('Not connected — cannot send command', 'error');
    }
  }

  function uninstallApp(deviceId, packageName, appName) {
    if (!confirm(`Uninstall ${appName} (${packageName})?`)) return;
    const sent = WS.sendCommand(deviceId, {
      type: 'uninstall_app',
      packageName,
    });
    if (sent) {
      UI.toast(`Uninstalling ${appName}…`, 'info');
      appendDeviceOutput(deviceId, `$ uninstall_app ${packageName}`);
    } else {
      UI.toast('Not connected — cannot send command', 'error');
    }
  }

  function toggleApp(deviceId, packageName, currentlyEnabled) {
    const type = currentlyEnabled ? 'disable_app' : 'enable_app';
    const label = currentlyEnabled ? 'Disabling' : 'Enabling';
    const sent = WS.sendCommand(deviceId, { type, packageName });
    if (sent) {
      UI.toast(`${label} ${packageName}…`, 'info');
      appendDeviceOutput(deviceId, `$ ${type} ${packageName}`);
    } else {
      UI.toast('Not connected — cannot send command', 'error');
    }
  }

  function runCommand(deviceId) {
    const input = document.getElementById('cmd-input');
    if (!input) return;
    const command = input.value.trim();
    if (!command) return;

    appendDeviceOutput(deviceId, `$ ${command}\nExecuting...`);

    const sent = WS.sendCommand(deviceId, { type: 'run_command', command });
    if (sent) {
      UI.toast('Command sent', 'info');
      input.value = '';
    } else {
      UI.toast('Not connected — cannot send command', 'error');
    }
  }

  function runScript(deviceId) {
    const input = document.getElementById('script-input');
    if (!input) return;
    const script = input.value.trim();
    if (!script) return;

    appendDeviceOutput(deviceId, `$ [run_script - ${script.split('\n').length} lines]\nExecuting...`);

    const sent = WS.sendCommand(deviceId, { type: 'run_script', script });
    if (sent) {
      UI.toast('Script sent', 'info');
      input.value = '';
    } else {
      UI.toast('Not connected — cannot send command', 'error');
    }
  }

  // Auto-init on load
  document.addEventListener('DOMContentLoaded', init);

  return {
    init, navigate, updateDevices, handleCommandAck, handleCommandResult, setConnectionStatus,
    getDevice, getDevices, getTargetDeviceId, getDeviceOutput,
    openInstallCatalog, clearTargetDevice,
    installApp, uninstallApp, toggleApp, runCommand, runScript,
  };
})();
