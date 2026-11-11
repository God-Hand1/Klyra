// ─── UI Rendering Module ───

const UI = (() => {
  const app = () => document.getElementById('app');

  // ─── SVG Icons (inline) ───
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    devices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
    apps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    script: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    toggleOn: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="5" width="22" height="14" rx="7" fill="#22c55e"/><circle cx="16" cy="12" r="5" fill="white"/></svg>',
    toggleOff: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="5" width="22" height="14" rx="7" fill="#444"/><circle cx="8" cy="12" r="5" fill="white"/></svg>',
  };

  function icon(name, cls = '') {
    return `<span class="icon ${cls}">${icons[name] || ''}</span>`;
  }

  // ─── Login Page ───
  function renderLogin(errorMsg = '') {
    app().innerHTML = `
      <div class="login-container">
        <div class="login-card ${errorMsg ? 'shake' : ''}">
          <div class="login-logo">
            ${icon('shield', 'login-icon')}
            <h1>Klyra</h1>
            <p class="login-subtitle">Mobile Device Management</p>
          </div>
          <form id="login-form" autocomplete="off">
            <div class="input-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" placeholder="Enter username" autocomplete="username" required>
            </div>
            <div class="input-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Enter password" autocomplete="current-password" required>
            </div>
            ${errorMsg ? `<div class="login-error">${Utils.escapeHtml(errorMsg)}</div>` : ''}
            <button type="submit" class="btn btn-primary btn-full" id="login-btn">
              <span class="btn-text">Sign In</span>
              <span class="btn-loader hidden"></span>
            </button>
          </form>
        </div>
      </div>
    `;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('username').focus();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    btn.disabled = true;
    btnText.textContent = 'Signing in…';
    btnLoader.classList.remove('hidden');

    try {
      await Auth.login(username, password);
      App.init();
    } catch (err) {
      renderLogin(err.message || 'Login failed');
    }
  }

  // ─── Main Layout ───
  function renderMainLayout() {
    app().innerHTML = `
      <div class="layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-logo">
            ${icon('shield', 'logo-icon')}
            <span class="logo-text">Klyra</span>
          </div>
          <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-view="dashboard">
              ${icon('dashboard')}
              <span>Dashboard</span>
            </a>
            <a href="#" class="nav-item" data-view="devices">
              ${icon('devices')}
              <span>Devices</span>
            </a>
            <a href="#" class="nav-item" data-view="apps">
              ${icon('apps')}
              <span>App Catalog</span>
            </a>
            <a href="#" class="nav-item" data-view="settings">
              ${icon('settings')}
              <span>Settings</span>
            </a>
          </nav>
          <div class="sidebar-footer">
            <button class="nav-item logout-btn" onclick="Auth.logout()">
              ${icon('logout')}
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <div class="main-wrapper">
          <header class="topbar">
            <button class="mobile-menu-btn" onclick="UI.toggleSidebar()">
              <span></span><span></span><span></span>
            </button>
            <div class="topbar-left">
              <h2 id="page-title">Dashboard</h2>
            </div>
            <div class="topbar-right">
              <div class="connection-status" id="connection-status">
                <span class="conn-dot"></span>
                <span class="conn-text">Connecting…</span>
              </div>
              <div class="device-count-badge" id="device-count-badge" title="Online devices">
                ${icon('devices')}
                <span id="online-count">0</span>
              </div>
              <div class="admin-badge">
                <span class="admin-avatar">${Auth.getUser().charAt(0).toUpperCase()}</span>
                <span class="admin-name">${Utils.escapeHtml(Auth.getUser())}</span>
              </div>
            </div>
          </header>

          <main class="content" id="main-content">
            <div class="skeleton-grid">
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
              <div class="skeleton-card"></div>
            </div>
          </main>
        </div>

        <!-- Mobile bottom nav -->
        <nav class="mobile-nav" id="mobile-nav">
          <a href="#" class="mobile-nav-item active" data-view="dashboard">
            ${icon('dashboard')}
            <span>Home</span>
          </a>
          <a href="#" class="mobile-nav-item" data-view="devices">
            ${icon('devices')}
            <span>Devices</span>
          </a>
          <a href="#" class="mobile-nav-item" data-view="apps">
            ${icon('apps')}
            <span>Apps</span>
          </a>
          <a href="#" class="mobile-nav-item" data-view="settings">
            ${icon('settings')}
            <span>Settings</span>
          </a>
        </nav>
      </div>
    `;

    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        App.navigate(el.dataset.view);
      });
    });
  }

  function setActiveNav(view) {
    document.querySelectorAll('[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    const title = document.getElementById('page-title');
    const titles = { dashboard: 'Dashboard', devices: 'Devices', apps: 'App Catalog', settings: 'Settings' };
    if (title) title.textContent = titles[view] || view;
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  }

  // ─── Connection Status ───
  function updateConnectionStatus(status) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    el.className = 'connection-status ' + status;
    const dot = el.querySelector('.conn-dot');
    const text = el.querySelector('.conn-text');
    if (status === 'connected') {
      text.textContent = 'Connected';
    } else if (status === 'reconnecting') {
      text.textContent = 'Reconnecting…';
    } else {
      text.textContent = 'Disconnected';
    }
  }

  // ─── Dashboard View ───
  function renderDashboard(devices) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const total = devices.length;
    const online = devices.filter(d => d.online).length;
    const offline = total - online;
    const totalApps = devices.reduce((sum, d) => sum + (d.installedApps ? d.installedApps.length : 0), 0);

    const allCommands = [];
    devices.forEach(d => {
      (d.pendingCommands || []).forEach(cmd => {
        allCommands.push({ ...cmd, deviceName: d.deviceName || d.deviceId });
      });
    });
    allCommands.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    const recent = allCommands.slice(0, 10);

    content.innerHTML = `
      <div class="dashboard-grid">
        <div class="stat-card" onclick="App.navigate('devices')">
          <div class="stat-icon blue">${icon('monitor')}</div>
          <div class="stat-info">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Total Devices</span>
          </div>
        </div>
        <div class="stat-card" onclick="App.navigate('devices')">
          <div class="stat-icon green">${icon('wifi')}</div>
          <div class="stat-info">
            <span class="stat-value">${online}</span>
            <span class="stat-label">Online</span>
          </div>
        </div>
        <div class="stat-card" onclick="App.navigate('devices')">
          <div class="stat-icon red">${icon('wifi')}</div>
          <div class="stat-info">
            <span class="stat-value">${offline}</span>
            <span class="stat-label">Offline</span>
          </div>
        </div>
        <div class="stat-card" onclick="App.navigate('apps')">
          <div class="stat-icon purple">${icon('package')}</div>
          <div class="stat-info">
            <span class="stat-value">${totalApps}</span>
            <span class="stat-label">Apps Installed</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">${icon('activity')} Recent Activity</h3>
        ${recent.length === 0 ? renderEmptyState('No recent activity', 'Commands and actions will appear here') : `
          <div class="activity-list">
            ${recent.map(cmd => `
              <div class="activity-item">
                <span class="activity-badge status-${cmd.status || 'pending'}">${cmd.status || 'pending'}</span>
                <span class="activity-type">${Utils.escapeHtml(cmd.type || 'command')}</span>
                <span class="activity-device">${Utils.escapeHtml(cmd.deviceName)}</span>
                <span class="activity-time">${Utils.timeAgo(cmd.sentAt)}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  // ─── Devices View ───
  function renderDevices(devices) {
    const content = document.getElementById('main-content');
    if (!content) return;

    if (devices.length === 0) {
      content.innerHTML = renderEmptyState(
        'No devices connected',
        'Devices will appear here when they connect to the Klyra MDM server.'
      );
      return;
    }

    content.innerHTML = `
      <div class="devices-grid">
        ${devices.map(d => `
          <div class="device-card" onclick="UI.openDeviceModal('${Utils.escapeHtml(d.deviceId)}')">
            <div class="device-card-header">
              <span class="device-status-dot ${d.online ? 'online' : 'offline'}"></span>
              <span class="device-name">${Utils.escapeHtml(d.deviceName || d.deviceId)}</span>
            </div>
            <div class="device-card-body">
              <div class="device-meta">
                <span class="device-model">${Utils.escapeHtml(d.model || 'Unknown')}</span>
                <span class="device-android">Android ${Utils.escapeHtml(d.androidVersion || '?')}</span>
              </div>
              <div class="device-apps-count">
                ${icon('package')}
                <span>${(d.installedApps || []).length} apps</span>
              </div>
            </div>
            <div class="device-card-footer">
              <span class="device-seen">${d.online ? 'Online' : `Last seen ${Utils.timeAgo(d.lastSeen)}`}</span>
              ${icon('chevronRight', 'chevron')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── Device Detail Modal ───
  function openDeviceModal(deviceId) {
    const device = App.getDevice(deviceId);
    if (!device) return;

    const modal = document.getElementById('device-modal');
    const nameEl = document.getElementById('modal-device-name');
    const statusEl = document.getElementById('modal-device-status');
    const bodyEl = document.getElementById('modal-device-content');

    nameEl.textContent = device.deviceName || device.deviceId;
    statusEl.textContent = device.online ? 'Online' : 'Offline';
    statusEl.className = `status-badge ${device.online ? 'online' : 'offline'}`;

    const apps = device.installedApps || [];
    const cmds = (device.pendingCommands || []).slice().sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    const outputText = App.getDeviceOutput(deviceId);

    bodyEl.innerHTML = `
      <div class="device-detail-info">
        <div class="detail-row"><span class="detail-label">Device ID</span><span class="detail-value">${Utils.escapeHtml(device.deviceId)}</span></div>
        <div class="detail-row"><span class="detail-label">Model</span><span class="detail-value">${Utils.escapeHtml(device.model || 'Unknown')}</span></div>
        <div class="detail-row"><span class="detail-label">Android</span><span class="detail-value">${Utils.escapeHtml(device.androidVersion || 'Unknown')}</span></div>
        <div class="detail-row"><span class="detail-label">Last Seen</span><span class="detail-value">${Utils.timeAgo(device.lastSeen)}</span></div>
      </div>

      <div class="detail-section">
        <div class="detail-section-header">
          <h3>${icon('package')} Installed Apps (${apps.length})</h3>
          <button class="btn btn-sm btn-primary" onclick="App.openInstallCatalog('${Utils.escapeHtml(device.deviceId)}')">
            ${icon('download')} Install App
          </button>
        </div>
        ${apps.length === 0 ? '<p class="empty-text">No apps installed via Klyra</p>' : `
          <div class="app-list">
            ${apps.map(a => `
              <div class="app-list-item">
                <div class="app-list-info">
                  <span class="app-list-name">${Utils.escapeHtml(a.appName || a.packageName)}</span>
                  <span class="app-list-pkg">${Utils.escapeHtml(a.packageName)}</span>
                </div>
                <div class="app-list-actions">
                  <button class="btn-icon toggle-btn" title="${a.enabled !== false ? 'Disable' : 'Enable'}" 
                    onclick="App.toggleApp('${Utils.escapeHtml(device.deviceId)}', '${Utils.escapeHtml(a.packageName)}', ${a.enabled !== false})">
                    ${a.enabled !== false ? icon('toggleOn') : icon('toggleOff')}
                  </button>
                  <button class="btn-icon danger" title="Uninstall"
                    onclick="App.uninstallApp('${Utils.escapeHtml(device.deviceId)}', '${Utils.escapeHtml(a.packageName)}', '${Utils.escapeHtml(a.appName || a.packageName)}')">
                    ${icon('trash')}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div class="detail-section">
        <h3>${icon('terminal')} Run Command</h3>
        <div class="command-input-row">
          <input type="text" id="cmd-input" class="input" placeholder="e.g. ls /sdcard" onkeydown="if(event.key==='Enter') App.runCommand('${Utils.escapeHtml(device.deviceId)}')">
          <button class="btn btn-primary" onclick="App.runCommand('${Utils.escapeHtml(device.deviceId)}')">
            ${icon('play')} Run
          </button>
        </div>
      </div>

      <div class="detail-section">
        <h3>${icon('script')} Run Script</h3>
        <textarea id="script-input" class="input textarea" placeholder="#!/bin/sh\necho hello" rows="3"></textarea>
        <button class="btn btn-primary mt-sm" onclick="App.runScript('${Utils.escapeHtml(device.deviceId)}')">
          ${icon('play')} Execute Script
        </button>
      </div>

      <div class="detail-section">
        <h3>${icon('terminal')} Command & Script Output</h3>
        <pre id="cmd-output" class="cmd-terminal-output">${Utils.escapeHtml(outputText)}</pre>
      </div>

      <div class="detail-section">
        <h3>${icon('activity')} Live Command History</h3>
        ${cmds.length === 0 ? '<p class="empty-text">No commands sent yet</p>' : `
          <div class="cmd-history">
            ${cmds.map(c => `
              <div class="cmd-item">
                <span class="activity-badge status-${c.status || 'pending'}">${c.status || 'pending'}</span>
                <span class="cmd-type">${Utils.escapeHtml(c.type || 'command')}</span>
                ${c.message ? `<span class="cmd-message">${Utils.escapeHtml(Utils.truncate(c.message, 120))}</span>` : ''}
                <span class="cmd-time">${Utils.timeAgo(c.sentAt)}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.dataset.deviceId = deviceId;
    document.body.style.overflow = 'hidden';
  }

  function updateModalOutput(text) {
    const pre = document.getElementById('cmd-output');
    if (pre) {
      pre.textContent = text;
      pre.scrollTop = pre.scrollHeight;
    }
  }

  function refreshDeviceModal() {
    const modal = document.getElementById('device-modal');
    if (modal && !modal.classList.contains('hidden') && modal.dataset.deviceId) {
      // Keep input states if active
      const activeCmdInput = document.getElementById('cmd-input')?.value;
      const activeScriptInput = document.getElementById('script-input')?.value;
      openDeviceModal(modal.dataset.deviceId);
      if (activeCmdInput && document.getElementById('cmd-input')) {
        document.getElementById('cmd-input').value = activeCmdInput;
      }
      if (activeScriptInput && document.getElementById('script-input')) {
        document.getElementById('script-input').value = activeScriptInput;
      }
    }
  }

  function closeDeviceModal() {
    const modal = document.getElementById('device-modal');
    if (modal) {
      modal.classList.add('hidden');
      delete modal.dataset.deviceId;
      document.body.style.overflow = '';
    }
  }

  // ─── App Catalog View ───
  function renderAppCatalog(apps, devices, targetDeviceId) {
    const content = document.getElementById('main-content');
    if (!content) return;

    const targetDevice = targetDeviceId ? App.getDevice(targetDeviceId) : null;

    let targetBanner = '';
    if (targetDevice) {
      targetBanner = `
        <div class="target-device-banner">
          <div class="target-device-info">
            ${icon('devices')}
            <span>Installing apps directly on <strong>${Utils.escapeHtml(targetDevice.deviceName || targetDevice.deviceId)}</strong></span>
          </div>
          <button class="btn btn-sm btn-icon" onclick="App.clearTargetDevice()" title="Clear target device">
            ${icon('close')}
          </button>
        </div>
      `;
    }

    if (!apps || apps.length === 0) {
      content.innerHTML = targetBanner + renderEmptyState('No apps in catalog', 'The app catalog is empty.');
      return;
    }

    content.innerHTML = `
      ${targetBanner}
      <div class="apps-grid">
        ${apps.map(a => `
          <div class="app-card">
            <div class="app-card-header">
              ${a.icon ? `<img src="${Utils.escapeHtml(a.icon)}" class="app-icon" alt="" onerror="this.style.display='none'">` : `<div class="app-icon-placeholder">${icon('package')}</div>`}
              <div class="app-card-title">
                <span class="app-name">${Utils.escapeHtml(a.appName || a.name)}</span>
                <span class="category-badge" style="background:${Utils.categoryColor(a.category)}20;color:${Utils.categoryColor(a.category)}">${Utils.escapeHtml(a.category || 'App')}</span>
              </div>
            </div>
            <p class="app-desc">${Utils.escapeHtml(Utils.truncate(a.description, 100))}</p>
            ${targetDevice ? `
              <button class="btn btn-primary btn-sm btn-full" onclick="App.installApp('${Utils.escapeHtml(targetDevice.deviceId)}', '${Utils.escapeHtml(a.packageName)}', '${Utils.escapeHtml(a.appName || a.name)}', '${Utils.escapeHtml(a.apkUrl || '')}')">
                ${icon('download')} Install on ${Utils.escapeHtml(targetDevice.deviceName || targetDevice.deviceId)}
              </button>
            ` : `
              <button class="btn btn-primary btn-sm btn-full" onclick="UI.openDeviceSelector('${Utils.escapeHtml(a.packageName)}', '${Utils.escapeHtml(a.appName || a.name)}', '${Utils.escapeHtml(a.apkUrl || '')}')">
                ${icon('download')} Install
              </button>
            `}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── Device Selector (for install) ───
  function openDeviceSelector(packageName, appName, apkUrl) {
    const devices = App.getDevices();
    const modal = document.getElementById('device-selector-modal');
    const bodyEl = document.getElementById('device-selector-content');

    const onlineDevices = devices.filter(d => d.online);

    bodyEl.innerHTML = `
      <p class="selector-subtitle">Install <strong>${Utils.escapeHtml(appName)}</strong> on:</p>
      ${onlineDevices.length === 0 ? '<p class="empty-text">No online devices available</p>' : `
        <div class="device-selector-list">
          ${onlineDevices.map(d => `
            <button class="device-selector-item" onclick="App.installApp('${Utils.escapeHtml(d.deviceId)}', '${Utils.escapeHtml(packageName)}', '${Utils.escapeHtml(appName)}', '${Utils.escapeHtml(apkUrl)}'); UI.closeDeviceSelector();">
              <span class="device-status-dot online"></span>
              <span>${Utils.escapeHtml(d.deviceName || d.deviceId)}</span>
              ${icon('chevronRight', 'chevron')}
            </button>
          `).join('')}
        </div>
      `}
    `;

    modal.classList.remove('hidden');
  }

  function closeDeviceSelector() {
    const modal = document.getElementById('device-selector-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ─── Settings View ───
  function renderSettings() {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = `
      <div class="settings-page">
        <div class="settings-card">
          <h3>Account</h3>
          <div class="detail-row">
            <span class="detail-label">Signed in as</span>
            <span class="detail-value">${Utils.escapeHtml(Auth.getUser())}</span>
          </div>
          <button class="btn btn-danger mt-md" onclick="Auth.logout()">
            ${icon('logout')} Sign Out
          </button>
        </div>
        <div class="settings-card">
          <h3>System Information</h3>
          <p class="empty-text">Klyra MDM Admin Console v1.0.0</p>
          <p class="empty-text">WebSocket Real-Time Fleet Controller.</p>
        </div>
      </div>
    `;
  }

  // ─── Online Count Badge ───
  function updateOnlineCount(count) {
    const el = document.getElementById('online-count');
    if (el) el.textContent = count;
  }

  // ─── Empty State ───
  function renderEmptyState(title, subtitle) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon('monitor')}</div>
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </div>
    `;
  }

  // ─── Toast Notifications ───
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));

    setTimeout(() => {
      el.classList.remove('show');
      el.addEventListener('transitionend', () => el.remove());
    }, 4000);
  }

  return {
    renderLogin, renderMainLayout, setActiveNav, toggleSidebar,
    updateConnectionStatus, renderDashboard, renderDevices,
    openDeviceModal, updateModalOutput, refreshDeviceModal, closeDeviceModal,
    renderAppCatalog, openDeviceSelector, closeDeviceSelector,
    renderSettings, updateOnlineCount, toast, icon,
  };
})();
