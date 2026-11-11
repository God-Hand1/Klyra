// ─── WebSocket Client ───

const WS = (() => {
  let socket = null;
  let reconnectTimer = null;
  let reconnectDelay = 1000;
  const MAX_DELAY = 30000;
  let intentionalClose = false;

  function connect() {
    const token = Auth.getToken();
    if (!token) return;

    intentionalClose = false;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws/admin?token=${encodeURIComponent(token)}`;

    try {
      socket = new WebSocket(url);
    } catch (e) {
      console.error('[WS] Connect error:', e);
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      console.log('[WS] Connected to /ws/admin');
      reconnectDelay = 1000;
      App.setConnectionStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('[WS] Bad message payload:', e);
      }
    };

    socket.onclose = (e) => {
      console.log('[WS] Closed', e.code, e.reason);
      socket = null;
      if (!intentionalClose) {
        App.setConnectionStatus('reconnecting');
        scheduleReconnect();
      } else {
        App.setConnectionStatus('disconnected');
      }
    };

    socket.onerror = (e) => {
      console.error('[WS] Socket error:', e);
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      console.log(`[WS] Reconnecting in ${reconnectDelay}ms...`);
      connect();
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY);
    }, reconnectDelay);
  }

  function disconnect() {
    intentionalClose = true;
    clearTimeout(reconnectTimer);
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  function send(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('[WS] Not connected, cannot send');
    return false;
  }

  function sendCommand(deviceId, command) {
    return send({ type: 'send_command', deviceId, command });
  }

  function handleMessage(data) {
    if (data.type === 'devices_update' || data.type === 'state_update' || data.type === 'full_state') {
      App.updateDevices(data.devices || []);
    } else if (data.type === 'command_ack') {
      App.handleCommandAck(data);
    } else if (data.type === 'command_result') {
      App.handleCommandResult(data);
    } else if (Array.isArray(data)) {
      App.updateDevices(data);
    } else if (data && typeof data === 'object' && data.devices) {
      App.updateDevices(data.devices);
    }
  }

  return { connect, disconnect, send, sendCommand };
})();
