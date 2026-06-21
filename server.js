const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { spawn, exec, execFile } = require('child_process');
const https = require('https');
const open = require('open');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let PORT = 5050;
const BIN_DIR = path.join(__dirname, 'bin');
const SCRCPY_DIR = path.join(BIN_DIR, 'scrcpy-win64-v3.0');
const SCRCPY_EXE = path.join(SCRCPY_DIR, 'scrcpy.exe');
const ADB_EXE = path.join(SCRCPY_DIR, 'adb.exe');
const SCRCPY_ZIP_URL = 'https://github.com/Genymobile/scrcpy/releases/download/v3.0/scrcpy-win64-v3.0.zip';
const ZIP_PATH = path.join(BIN_DIR, 'scrcpy.zip');

let scrcpyProcess = null;
let downloadStatus = { status: 'idle', progress: 0 };

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper: Ensure directory exists
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Download and Extract scrcpy
function downloadScrcpy() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(SCRCPY_EXE)) {
      downloadStatus = { status: 'ready', progress: 100 };
      return resolve();
    }

    ensureDirExists(BIN_DIR);
    console.log('Downloading scrcpy v3.0 (Windows 64-bit)... This might take a moment.');
    downloadStatus = { status: 'downloading', progress: 0 };
    io.emit('download-status', downloadStatus);

    const file = fs.createWriteStream(ZIP_PATH);
    
    // Perform HTTPS request with redirect handling
    function get(url) {
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          get(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: Server returned ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10) || 0;
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          file.write(chunk);
          
          if (totalSize > 0) {
            const percentage = Math.round((downloadedSize / totalSize) * 100);
            if (percentage !== downloadStatus.progress) {
              downloadStatus.progress = percentage;
              io.emit('download-status', downloadStatus);
              process.stdout.write(`\rDownload Progress: ${percentage}%`);
            }
          }
        });

        response.on('end', () => {
          file.end(() => {
            console.log('\nDownload complete. Extracting files...');
            downloadStatus = { status: 'extracting', progress: 100 };
            io.emit('download-status', downloadStatus);

            // Use Windows PowerShell to unzip natively
            const psCommand = `powershell.exe -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${BIN_DIR}' -Force"`;
            exec(psCommand, (err) => {
              // Delete zip file in both success and failure cases to clean up
              try { fs.unlinkSync(ZIP_PATH); } catch (e) {}

              if (err) {
                console.error('Error during extraction:', err);
                downloadStatus = { status: 'error', error: err.message };
                io.emit('download-status', downloadStatus);
                return reject(err);
              }

              console.log('Extraction complete! scrcpy is ready.');
              downloadStatus = { status: 'ready', progress: 100 };
              io.emit('download-status', downloadStatus);
              resolve();
            });
          });
        });
      }).on('error', (err) => {
        try { fs.unlinkSync(ZIP_PATH); } catch (e) {}
        console.error('Download error:', err);
        downloadStatus = { status: 'error', error: err.message };
        io.emit('download-status', downloadStatus);
        reject(err);
      });
    }

    get(SCRCPY_ZIP_URL);
  });
}

// Route: Get device list
app.get('/api/devices', (req, res) => {
  if (!fs.existsSync(ADB_EXE)) {
    return res.json({ success: false, error: 'ADB not found. Please wait for initialization.' });
  }

  // Run adb devices safely using execFile
  execFile(ADB_EXE, ['devices'], (err, stdout, stderr) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }

    const lines = stdout.trim().split('\n');
    const devices = [];
    // Skip the first line ("List of devices attached")
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, state] = line.split(/\s+/);
        devices.push({ id, state });
      }
    }

    res.json({ success: true, devices });
  });
});

// Route: Get scrcpy status
app.get('/api/status', (req, res) => {
  res.json({
    download: downloadStatus,
    mirroring: scrcpyProcess !== null
  });
});

// Start Mirroring Websocket / API
app.post('/api/start-mirror', (req, res) => {
  if (!fs.existsSync(SCRCPY_EXE)) {
    return res.json({ success: false, error: 'scrcpy executable not found.' });
  }

  if (scrcpyProcess) {
    return res.json({ success: false, error: 'Mirroring is already running.' });
  }

  const {
    deviceId,
    resolution,
    fps,
    bitrate,
    audioOption,
    alwaysOnTop,
    borderless,
    fullscreen,
    turnScreenOff,
    stayAwake,
    recordVideo
  } = req.body;

  const args = [];

  // Device targeting
  if (deviceId) {
    args.push('-s', deviceId);
  }

  // Resolution limit
  if (resolution && resolution !== 'original') {
    args.push('--max-size', resolution);
  }

  // FPS limit
  if (fps && fps !== 'unlimited') {
    args.push('--max-fps', fps);
  }

  // Bitrate limit
  if (bitrate) {
    args.push('--video-bit-rate', bitrate + 'M');
  }

  // Audio settings
  if (audioOption === 'mute-phone') {
    // Redirection and play on PC is the default on Android 11+.
    // We can also pass playback source
    args.push('--audio-source=playback');
  } else if (audioOption === 'dup') {
    args.push('--audio-source=playback', '--audio-dup');
  } else if (audioOption === 'disable') {
    args.push('--no-audio');
  }

  // Toggles
  if (alwaysOnTop) {
    args.push('--always-on-top');
  }
  if (borderless) {
    args.push('--window-borderless');
  }
  if (fullscreen) {
    args.push('--fullscreen');
  }
  if (turnScreenOff) {
    args.push('--turn-screen-off');
  }
  if (stayAwake) {
    args.push('--stay-awake');
  }
  if (recordVideo) {
    const videoPath = path.join(__dirname, 'recordings');
    ensureDirExists(videoPath);
    const filename = `recording_${Date.now()}.mp4`;
    args.push('--record', path.join(videoPath, filename));
    console.log(`Recording enabled. Saving to recordings/${filename}`);
  }

  console.log(`Starting scrcpy with args: ${args.join(' ')}`);

  // Spawn scrcpy process
  scrcpyProcess = spawn(SCRCPY_EXE, args, { cwd: SCRCPY_DIR });

  io.emit('status-change', { mirroring: true });

  scrcpyProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) {
      io.emit('log', { type: 'stdout', message: msg });
      console.log(`[scrcpy stdout] ${msg}`);
    }
  });

  scrcpyProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) {
      io.emit('log', { type: 'stderr', message: msg });
      console.log(`[scrcpy stderr] ${msg}`);
    }
  });

  scrcpyProcess.on('close', (code) => {
    console.log(`scrcpy process exited with code ${code}`);
    scrcpyProcess = null;
    io.emit('status-change', { mirroring: false });
    io.emit('log', { type: 'info', message: `Mirroring closed (exit code ${code})` });
  });

  res.json({ success: true });
});

// Route: Stop Mirroring
app.post('/api/stop-mirror', (req, res) => {
  if (!scrcpyProcess) {
    return res.json({ success: false, error: 'Mirroring is not running.' });
  }

  scrcpyProcess.kill();
  res.json({ success: true });
});

// Socket connection
io.on('connection', (socket) => {
  socket.emit('download-status', downloadStatus);
  socket.emit('status-change', { mirroring: scrcpyProcess !== null });
});

// Start Server with dynamic fallback
function startServer(port) {
  const listenError = (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use. Retrying on port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  };

  server.once('error', listenError);

  server.listen(port, async () => {
    server.removeListener('error', listenError);

    console.log(`=======================================================`);
    console.log(` MeRoarringHD Server running at http://localhost:${port}`);
    console.log(`=======================================================`);
    
    // Try to open browser
    try {
      await open(`http://localhost:${port}`);
    } catch (e) {
      console.log(`Browser failed to open automatically. Open http://localhost:${port} manually.`);
    }

    // Start downloader check
    try {
      await downloadScrcpy();
    } catch (err) {
      console.error('Failed to initialize scrcpy:', err);
    }
  });
}

startServer(PORT);
