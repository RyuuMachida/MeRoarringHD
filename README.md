<p align="center">
  <img src="logo.svg" width="128" alt="MeRoarringHD Logo" />
</p>

<h1 align="center">MeRoarringHD</h1>

<p align="center">
  <b>Low-latency real-time screen & audio mirroring dashboard for mobile devices.</b>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/RyuuMachida/MeRoarringHD?color=blue&style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-green?style=flat-square" alt="Node Version" />
  <img src="https://img.shields.io/badge/scrcpy-v3.0-orange?style=flat-square" alt="scrcpy engine" />
  <img src="https://img.shields.io/badge/platform-windows-blue?style=flat-square" alt="Platform" />
</p>

---

## 🚀 Deskripsi Proyek / Project Description

**MeRoarringHD** adalah aplikasi web kontrol dan mirroring layar + audio perangkat mobile secara real-time, beresolusi tinggi, dan berlatensi sangat rendah. Aplikasi ini berjalan secara lokal sebagai server Node.js dan mengotomatiskan jalannya engine mirroring `scrcpy` (untuk Android) serta mengintegrasikan panduan lengkap untuk iOS AirPlay.

*MeRoarringHD is a premium, real-time, low-latency, and high-definition screen and audio mirroring control center. It runs locally as a Node.js web server and automates the streaming configuration of the scrcpy engine for Android devices, and details instructions for iOS AirPlay.*

---

## 🛠️ Tech Stack
Aplikasi ini dibangun menggunakan teknologi native/modern berikut:

* **Backend:**
  - **Node.js** (Runtime environment)
  - **Express.js** (Server HTTP & penyedia API)
  - **Socket.io** (Komunikasi dua arah real-time untuk log engine & status unduhan)
  - **Adm-Zip** & **Node-Fetch** (Otomatisasi pengunduhan & ekstraksi engine scrcpy)
* **Frontend:**
  - **HTML5** (Semantik struktur halaman)
  - **Vanilla CSS3** (Sistem flexbox/grid, custom scrollbar, animasi unrolling dropdown, sliding indicator, dan layout no-scroll `100vh`)
  - **JavaScript (ES6+)** (Manajemen input, MutationObserver untuk sinkronisasi dropdown, interaksi DOM, dan WebSocket Client)
* **Engine Mirroring:**
  - **Genymobile scrcpy v3.0** (Android screen mirroring engine)
  - **ADB (Android Debug Bridge)** (Komunikasi perangkat USB/Wi-Fi)

---

## 🚀 Fitur Utama / Key Features
- **HD Screen Mirroring:** Mirroring layar resolusi tinggi yang dapat disesuaikan (1080p FHD, 720p HD, 576p SD) dengan framerate limit lock hingga 60 FPS+.
- **Audio Forwarding & Muting:** Mengirimkan audio internal HP ke PC sekaligus mematikan speaker HP (didukung penuh untuk Android 11+).
- **Setup Engine Otomatis:** Mengunduh dan mengekstrak program `scrcpy` v3.0 resmi secara otomatis pada peluncuran pertama tanpa perlu konfigurasi manual.
- **Desain UI Premium:** UI flat solid bergaya modern berpalet warna kontras tinggi (*Almond Cream, Prussian Blue, Dusty Grape, Ink Black*), tanpa glassmorphism, tanpa bayangan (box shadow), dan bebas emoji (menggunakan SVG murni).
- **Custom Dropdown & Animasi Unrolling:** Dropdown kustom dengan animasi gulungan membuka yang smooth dan rotasi ikon panah yang interaktif.
- **Sliding Underline Tab Indicator:** Transisi tab dokumentasi dihiasi dengan garis bawah penanda yang bergeser secara halus mengikuti koordinat tombol tab yang diklik.
- **Kontrol Baterai & Daya:** Fitur mematikan layar HP ketika mirroring aktif (*Turn Off Phone Screen*) untuk menghemat baterai HP dan mencegah panas.
- **Borderless Window:** Tombol pintasan untuk memicu scrcpy tanpa bingkai jendela (menghilangkan bar putih Windows di bagian atas).

---

## 📋 Persyaratan Sistem / System Requirements
- **Sistem Operasi:** Windows 10 / 11 (64-bit).
- **Node.js:** Versi 16 atau lebih baru (Disarankan versi LTS terbaru).
- **Kabel USB:** Kabel USB berkualitas tinggi yang mendukung transfer data.
- **Android:** Versi 11 ke atas untuk dukungan transfer audio langsung.

---

## 🚀 Panduan Pemakaian / Usage Guide

### Bahasa Indonesia 🇮🇩

1. **Unduh/Klon Proyek:**
   Pastikan seluruh file proyek berada di dalam satu folder bernama `MeRoarringHD`.

2. **Jalankan Aplikasi:**
   Cukup klik dua kali (double-click) pada file **`start.bat`**. Script akan:
   - Memverifikasi instalasi Node.js di komputer Anda.
   - Mengunduh dependensi NPM (`npm install`) jika belum ada.
   - Mengunduh engine `scrcpy` resmi secara otomatis pada pemakaian pertama.
   - Membuka halaman kontrol di browser default Anda pada alamat `http://localhost:5050`.

3. **Aktifkan Opsi Pengembang di HP:**
   - Masuk ke **Pengaturan > Tentang Ponsel** di HP Anda.
   - Ketuk **Build Number** sebanyak 7 kali hingga muncul pesan "Anda sekarang adalah pengembang".
   - Buka menu **Opsi Pengembang (Developer Options)** dan aktifkan opsi **USB Debugging**.

4. **Hubungkan & Mulai Mirroring:**
   - Hubungkan HP ke laptop menggunakan kabel USB.
   - Setujui izin Debugging USB yang muncul di layar HP Anda (Disarankan centang "Selalu izinkan dari komputer ini").
   - Pada browser (`http://localhost:5050`), klik tombol **Scan Devices**.
   - Pilih HP Anda pada dropdown **Select Active Device**.
   - Sesuaikan parameter mirroring sesuai keinginan Anda.
   - Klik tombol ungu besar **START SCREEN MIRROR**.

### English 🇬🇧

1. **Download/Clone Project:**
   Make sure all files are in a folder named `MeRoarringHD`.

2. **Run the Application:**
   Double-click the **`start.bat`** file. The script will:
   - Check if Node.js is installed.
   - Automatically run `npm install` for dependencies.
   - Download the official `scrcpy` binaries on the first launch.
   - Automatically open the dashboard in your default browser at `http://localhost:5050`.

3. **Enable Developer Options & USB Debugging:**
   - Go to **Settings > About Phone** on your device.
   - Tap **Build Number** 7 times to enable Developer Mode.
   - Go to **Settings > System > Developer Options** and toggle on **USB Debugging**.

4. **Connect & Start Mirroring:**
   - Connect your phone using a high-quality USB cable.
   - Accept the **Allow USB Debugging** prompt on your phone screen.
   - Click **Scan Devices** in the control dashboard, select your device, and click **START SCREEN MIRROR**.

---

## 👥 Profil Pembuat / Creator Profiles

Proyek ini dibuat dan dikembangkan sepenuhnya oleh **RyuuMachida**. 

* **GitHub:** [@RyuuMachida](https://github.com/RyuuMachida)
* **TikTok:** [@rilss_ear1](https://www.tiktok.com/@rilss_ear1)

---

## 📄 Lisensi / License
Proyek ini dilisensikan di bawah **MIT License** - Lihat file [LICENSE](LICENSE) untuk detail lengkap.

*Hak Cipta & Paten Terdaftar atas nama **RyuuMachida**. Dilarang mendistribusikan ulang atau mengganti nama (rebrand) proyek ini tanpa atribusi pencipta asli.*
