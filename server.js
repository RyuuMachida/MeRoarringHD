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

// Pembantu: Pastiin foldernya ada
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Unduh dan ekstrak scrcpy secara otomatis
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
    
    // Jalankan request HTTPS dan handle redirect otomatis
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

            // Pake PowerShell bawaan Windows buat ekstrak zip secara native
            const psCommand = `powershell.exe -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${BIN_DIR}' -Force"`;
            exec(psCommand, (err) => {
              // Hapus file zip setelah selesai biar rapi
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

// Rute API: Ambil daftar perangkat yang terhubung
app.get('/api/devices', (req, res) => {
  if (!fs.existsSync(ADB_EXE)) {
    return res.json({ success: false, error: 'ADB not found. Please wait for initialization.' });
  }

  // Jalankan adb devices dengan execFile biar aman
  execFile(ADB_EXE, ['devices'], (err, stdout, stderr) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }

    const lines = stdout.trim().split('\n');
    const devices = [];
    // Lewati baris pertama ("List of devices attached")
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

// Rute API: Ambil status mirroring saat ini
app.get('/api/status', (req, res) => {
  res.json({
    download: downloadStatus,
    mirroring: scrcpyProcess !== null
  });
});

// Mulai proses mirroring
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

  // Targetin ID perangkat tertentu
  if (deviceId) {
    args.push('-s', deviceId);
  }

  // Batasin resolusi layar
  if (resolution && resolution !== 'original') {
    args.push('--max-size', resolution);
  }

  // Batasin fps
  if (fps && fps !== 'unlimited') {
    args.push('--max-fps', fps);
  }

  // Batasin bitrate video
  if (bitrate) {
    args.push('--video-bit-rate', bitrate + 'M');
  }

  // Setelan suara
  if (audioOption === 'mute-phone') {
    // Secara bawaan suara masuk ke PC untuk Android 11+
    args.push('--audio-source=playback');
  } else if (audioOption === 'dup') {
    args.push('--audio-source=playback', '--audio-dup');
  } else if (audioOption === 'disable') {
    args.push('--no-audio');
  }

  // Setelan toggle tambahan
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

  // Jalankan proses scrcpy
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

// Rute API: Hentikan proses mirroring
app.post('/api/stop-mirror', (req, res) => {
  if (!scrcpyProcess) {
    return res.json({ success: false, error: 'Mirroring is not running.' });
  }

  scrcpyProcess.kill();
  res.json({ success: true });
});

// Hubungkan koneksi real-time Socket.io
io.on('connection', (socket) => {
  socket.emit('download-status', downloadStatus);
  socket.emit('status-change', { mirroring: scrcpyProcess !== null });
});

// Jalankan server lokal dengan port fallback otomatis
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
    
    // Coba buka halaman dashboard di browser otomatis
    try {
      await open(`http://localhost:${port}`);
    } catch (e) {
      console.log(`Browser failed to open automatically. Open http://localhost:${port} manually.`);
    }

    // Cek dan download scrcpy kalau belum ada
    try {
      await downloadScrcpy();
    } catch (err) {
      console.error('Failed to initialize scrcpy:', err);
    }
  });
}

startServer(PORT);
