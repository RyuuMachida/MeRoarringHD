document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // DOM Elements
  const scrcpyStatus = document.getElementById('scrcpy-status');
  const deviceSelect = document.getElementById('device-select');
  const refreshDevicesBtn = document.getElementById('refresh-devices-btn');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const consoleLogs = document.getElementById('console-logs');
  const clearConsoleBtn = document.getElementById('clear-console-btn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Config Inputs
  const resolutionSelect = document.getElementById('resolution-select');
  const fpsSelect = document.getElementById('fps-select');
  const bitrateSelect = document.getElementById('bitrate-select');
  const audioSelect = document.getElementById('audio-select');
  const toggleAlwaysOnTop = document.getElementById('toggle-always-on-top');
  const toggleBorderless = document.getElementById('toggle-borderless');
  const toggleFullscreen = document.getElementById('toggle-fullscreen');
  const toggleTurnScreenOff = document.getElementById('toggle-turn-screen-off');
  const toggleStayAwake = document.getElementById('toggle-stay-awake');
  const toggleRecord = document.getElementById('toggle-record');

  let isScrcpyReady = false;

  // Helper to sync custom select disabled class
  function updateCustomDropdownsDisableState() {
    const selects = document.querySelectorAll('select.form-control');
    selects.forEach(select => {
      const customSelect = select.parentElement ? select.parentElement.querySelector('.custom-select') : null;
      if (customSelect) {
        if (select.disabled) {
          customSelect.classList.add('disabled');
          customSelect.classList.remove('open');
        } else {
          customSelect.classList.remove('disabled');
        }
      }
    });
  }

  // Custom Dropdown Builder (slides open with a smooth unrolling animation)
  function initCustomDropdowns() {
    const selects = document.querySelectorAll('select.form-control');
    
    selects.forEach(select => {
      const wrapper = select.parentElement;
      if (!wrapper) return;
      
      // Prevent double initialization
      if (wrapper.querySelector('.custom-select')) return;
      
      const customSelect = document.createElement('div');
      customSelect.className = 'custom-select';
      if (select.disabled) {
        customSelect.classList.add('disabled');
      }
      
      const trigger = document.createElement('div');
      trigger.className = 'custom-select-trigger';
      trigger.setAttribute('tabindex', '0');
      
      const triggerText = document.createElement('span');
      triggerText.className = 'custom-select-trigger-text';
      
      const arrow = document.createElement('span');
      arrow.className = 'custom-select-arrow';
      
      trigger.appendChild(triggerText);
      trigger.appendChild(arrow);
      customSelect.appendChild(trigger);
      
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'custom-options-container';
      customSelect.appendChild(optionsContainer);
      
      wrapper.appendChild(customSelect);
      
      function renderOptions() {
        optionsContainer.innerHTML = '';
        const options = select.querySelectorAll('option');
        
        if (options.length === 0) {
          triggerText.textContent = '';
          return;
        }
        
        // Match currently selected option
        let selectedOption = Array.from(options).find(opt => opt.value === select.value) || options[0];
        triggerText.textContent = selectedOption.textContent;
        
        options.forEach(opt => {
          const customOpt = document.createElement('div');
          customOpt.className = 'custom-option';
          customOpt.textContent = opt.textContent;
          customOpt.setAttribute('data-value', opt.value);
          
          if (opt.value === select.value) {
            customOpt.classList.add('selected');
          }
          
          customOpt.addEventListener('click', (e) => {
            e.stopPropagation();
            if (select.value !== opt.value) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            triggerText.textContent = opt.textContent;
            optionsContainer.querySelectorAll('.custom-option').forEach(co => co.classList.remove('selected'));
            customOpt.classList.add('selected');
            customSelect.classList.remove('open');
          });
          
          optionsContainer.appendChild(customOpt);
        });
      }
      
      renderOptions();
      
      // Toggle dropdown open/close on click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (customSelect.classList.contains('disabled')) return;
        
        document.querySelectorAll('.custom-select').forEach(cs => {
          if (cs !== customSelect) cs.classList.remove('open');
        });
        
        customSelect.classList.toggle('open');
      });
      
      // Accessibility support
      trigger.addEventListener('keydown', (e) => {
        if (customSelect.classList.contains('disabled')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        } else if (e.key === 'Escape') {
          customSelect.classList.remove('open');
        }
      });
      
      // Observe select element option changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            renderOptions();
          } else if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
            updateCustomDropdownsDisableState();
          }
        });
      });
      
      observer.observe(select, {
        childList: true,
        attributes: true,
        attributeFilter: ['disabled']
      });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('open'));
    });
  }
  let isMirroring = false;
  let devicePollInterval = null;

  // Log Message Helper
  function appendLog(message, type = 'stdout') {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleLogs.appendChild(logLine);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  // Clear Console
  clearConsoleBtn.addEventListener('click', () => {
    consoleLogs.innerHTML = '';
    appendLog('Console cleared.', 'system');
  });

  // Update Tab Underline Indicator Position & Width
  function updateTabIndicator() {
    const activeTab = document.querySelector('.tab-btn.active');
    const indicator = document.querySelector('.tab-indicator');
    const header = document.querySelector('.tabs-header');
    
    if (activeTab && indicator && header) {
      const activeRect = activeTab.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const leftOffset = activeRect.left - headerRect.left;
      
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.transform = `translateX(${leftOffset}px)`;
    }
  }

  // Tab Navigation
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      
      // Animate sliding tab indicator line
      updateTabIndicator();
    });
  });

  // Handle window resizing to keep the sliding indicator aligned
  window.addEventListener('resize', updateTabIndicator);

  // Fetch Connected Devices
  async function fetchDevices() {
    if (!isScrcpyReady) {
      deviceSelect.innerHTML = '<option value="">Waiting for mirroring engine...</option>';
      return;
    }
    
    if (deviceSelect.innerHTML.includes('Waiting') || deviceSelect.innerHTML.includes('No devices') || deviceSelect.innerHTML === '') {
      deviceSelect.innerHTML = '<option value="">Scanning for devices...</option>';
    }
    
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      
      if (data.success) {
        const devices = data.devices;
        
        if (devices.length === 0) {
          deviceSelect.innerHTML = '<option value="">No devices detected (Check cable/debugging)</option>';
          if (!isMirroring) startBtn.disabled = true;
        } else {
          deviceSelect.innerHTML = '';
          devices.forEach(device => {
            const opt = document.createElement('option');
            opt.value = device.id;
            opt.textContent = `${device.id} (${device.state === 'device' ? 'Ready' : device.state})`;
            deviceSelect.appendChild(opt);
          });
          if (!isMirroring) startBtn.disabled = false;
        }
      } else {
        deviceSelect.innerHTML = `<option value="">Scan failed: ${data.error}</option>`;
        appendLog(`Device scan error: ${data.error}`, 'stderr');
      }
    } catch (e) {
      deviceSelect.innerHTML = `<option value="">Scan failed: Server connection error</option>`;
      appendLog(`Failed to scan devices: ${e.message}`, 'stderr');
    }
  }

  // Start Device Polling
  function startDevicePolling() {
    if (devicePollInterval) clearInterval(devicePollInterval);
    fetchDevices();
    devicePollInterval = setInterval(fetchDevices, 4000);
  }

  // Stop Device Polling
  function stopDevicePolling() {
    if (devicePollInterval) {
      clearInterval(devicePollInterval);
      devicePollInterval = null;
    }
  }

  // Socket IO Receivers
  socket.on('download-status', (data) => {
    const dot = scrcpyStatus.querySelector('.status-dot');
    const text = scrcpyStatus.querySelector('.status-text');

    if (data.status === 'idle') {
      dot.className = 'status-dot warning';
      text.textContent = 'Initializing...';
      deviceSelect.innerHTML = '<option value="">Connecting to engine server...</option>';
      isScrcpyReady = false;
      startBtn.disabled = true;
    } else if (data.status === 'downloading') {
      dot.className = 'status-dot warning';
      text.textContent = `Downloading engine: ${data.progress}%`;
      deviceSelect.innerHTML = `<option value="">Downloading scrcpy engine (${data.progress}%)...</option>`;
      isScrcpyReady = false;
      startBtn.disabled = true;
    } else if (data.status === 'extracting') {
      dot.className = 'status-dot warning';
      text.textContent = 'Extracting engine binaries...';
      deviceSelect.innerHTML = '<option value="">Extracting mirroring tools...</option>';
      isScrcpyReady = false;
      startBtn.disabled = true;
    } else if (data.status === 'ready') {
      dot.className = 'status-dot success';
      text.textContent = 'Engine Ready';
      isScrcpyReady = true;
      appendLog('scrcpy engine is ready and active.', 'system');
      startDevicePolling();
    } else if (data.status === 'error') {
      dot.className = 'status-dot danger';
      text.textContent = 'Engine Error';
      deviceSelect.innerHTML = '<option value="">Engine setup error</option>';
      isScrcpyReady = false;
      startBtn.disabled = true;
      appendLog(`Engine setup error: ${data.error}`, 'stderr');
    }
  });

  socket.on('status-change', (data) => {
    isMirroring = data.mirroring;
    const launcherCard = document.querySelector('.launcher-panel');
    const headerCard = document.querySelector('.header');
    const dot = scrcpyStatus.querySelector('.status-dot');
    const text = scrcpyStatus.querySelector('.status-text');
    
    if (isMirroring) {
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      resolutionSelect.disabled = true;
      fpsSelect.disabled = true;
      bitrateSelect.disabled = true;
      audioSelect.disabled = true;
      deviceSelect.disabled = true;
      stopDevicePolling();
      
      launcherCard.classList.add('active-stream');
      headerCard.classList.add('active-stream');
      dot.className = 'status-dot danger pulsing';
      text.textContent = 'Live Mirroring Active';
    } else {
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      resolutionSelect.disabled = false;
      fpsSelect.disabled = false;
      bitrateSelect.disabled = false;
      audioSelect.disabled = false;
      deviceSelect.disabled = false;
      startDevicePolling();
      
      launcherCard.classList.remove('active-stream');
      headerCard.classList.remove('active-stream');
      if (isScrcpyReady) {
        dot.className = 'status-dot success';
        text.textContent = 'Engine Ready';
      }
    }
    
    // Sync the custom dropdown state
    updateCustomDropdownsDisableState();
  });

  socket.on('log', (data) => {
    appendLog(data.message, data.type);
  });

  // Action: Scan Devices Manually
  refreshDevicesBtn.addEventListener('click', () => {
    appendLog('Scanning for connected ADB devices...', 'system');
    fetchDevices();
  });

  // Action: Start Mirroring
  startBtn.addEventListener('click', async () => {
    const deviceId = deviceSelect.value;
    if (!deviceId && deviceSelect.options[0]?.text === 'No devices detected') {
      appendLog('No device selected. Please connect an Android phone first.', 'stderr');
      return;
    }

    const payload = {
      deviceId,
      resolution: resolutionSelect.value,
      fps: fpsSelect.value,
      bitrate: parseInt(bitrateSelect.value, 10),
      audioOption: audioSelect.value,
      alwaysOnTop: toggleAlwaysOnTop.checked,
      borderless: toggleBorderless.checked,
      fullscreen: toggleFullscreen.checked,
      turnScreenOff: toggleTurnScreenOff.checked,
      stayAwake: toggleStayAwake.checked,
      recordVideo: toggleRecord.checked
    };

    appendLog(`Launching screen mirroring for device: ${deviceId || 'default'}...`, 'info');

    try {
      const response = await fetch('/api/start-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!data.success) {
        appendLog(`Failed to start mirroring: ${data.error}`, 'stderr');
      }
    } catch (e) {
      appendLog(`Server connection error: ${e.message}`, 'stderr');
    }
  });

  // Action: Stop Mirroring
  stopBtn.addEventListener('click', async () => {
    appendLog('Requesting streaming shutdown...', 'info');
    try {
      const response = await fetch('/api/stop-mirror', { method: 'POST' });
      const data = await response.json();
      if (!data.success) {
        appendLog(`Shutdown error: ${data.error}`, 'stderr');
      }
    } catch (e) {
      appendLog(`Server connection error: ${e.message}`, 'stderr');
    }
  });

  // Bootstrapping Initial Status Check
  async function checkInitialStatus() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      isMirroring = data.mirroring;
      if (isMirroring) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        stopDevicePolling();
      } else {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
      }
    } catch (e) {
      console.error('Failed to get initial status:', e);
    }
  }

  // Protocol Check: Alert user if opening file directly
  if (window.location.protocol === 'file:') {
    const banner = document.getElementById('protocol-warning');
    if (banner) banner.classList.remove('hidden');
    appendLog('WARNING: You opened the HTML file directly. Clickable items will not work.', 'stderr');
  }

  // Initialize custom dropdowns
  initCustomDropdowns();
  updateCustomDropdownsDisableState();

  // Initialize sliding tab indicator position
  updateTabIndicator();

  checkInitialStatus();
});
