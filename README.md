<p align="center">
  <img src="logo.svg?v=2" width="120" alt="MeRoarringHD Logo" />
</p>

<h1 align="center">MeRoarringHD 🦁</h1>

<p align="center">
  <b>Mirroring layar & audio HP ke PC instan, lancar jaya, tanpa ribet setup!</b>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/RyuuMachida/MeRoarringHD?color=blue&style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-green?style=flat-square" alt="Node Version" />
  <img src="https://img.shields.io/badge/scrcpy-v3.0-orange?style=flat-square" alt="scrcpy engine" />
  <img src="https://img.shields.io/badge/platform-windows-blue?style=flat-square" alt="Platform" />
</p>

---

## 🤔 Kenapa MeRoarringHD?

Capek nyari aplikasi screen mirroring yang gratis tapi banyak iklan, lambat, atau ribet konfigurasinya? 

**MeRoarringHD** dibuat untuk menyelesaikan masalah itu. Tinggal colok kabel USB, **double-click `start.bat`**, layar dan audio HP Android kamu langsung tampil di PC secara real-time dengan latensi super rendah (hampir tanpa delay!). Bahkan, suara HP kamu bakal otomatis pindah ke laptop dan menonaktifkan speaker bawaan HP biar nggak berisik.

---

## ✨ Fitur Keren

- **⚡ Latensi Super Rendah & HD:** Kualitas streaming mantap (1080p FHD / 60 FPS+) tanpa delay yang mengganggu. Cocok buat gaming atau presentasi.
- **🔊 Audio Forwarding otomatis:** Suara dari game/aplikasi HP langsung keluar di laptop, dan speaker HP otomatis mati (khusus Android 11+).
- **🔋 Hemat Baterai (Screen Off):** Bisa mirroring sambil mematikan layar HP fisik kamu agar HP tidak panas dan hemat baterai.
- **📦 Auto-Install Engine:** Nggak perlu pusing download ADB atau Scrcpy manual. Saat pertama kali dijalankan, sistem bakal ngunduh semua binary resminya secara otomatis.
- **🖥️ Jendela Borderless:** Tampilan screen mirror bersih tanpa frame/title bar Windows yang mengganggu di layar Anda.
- **🎛️ Custom UI Modern:** Dropdown interaktif dengan animasi gulungan serta tab penunjuk yang bergeser mulus.

---

## 💻 Teknologi yang Digunakan

Aplikasi ini dirancang ringan tanpa framework berlebih:
- **Backend:** Node.js, Express (API & static file server), Socket.io (streaming console logs real-time).
- **Frontend:** HTML5, CSS3 murni (flat design, custom select, sliding indicator, 100vh lock), Vanilla JS.
- **Streaming Engine:** Genymobile scrcpy v3.0 (ADB communication).

---

## 📋 Sebelum Memulai

Pastikan laptop/PC kamu memenuhi syarat berikut:
1. Sudah terpasang **Node.js** (unduh di [nodejs.org](https://nodejs.org/)).
2. Menggunakan kabel data USB yang bagus (bisa transfer file, bukan kabel charger murah).
3. HP Android versi 11 ke atas (untuk fitur audio).

---

## 🚀 Cara Pakai (Gampang Banget!)

1. **Download & Ekstrak:** Unduh repositori ini dan pastikan semua berkas ada di dalam folder `MeRoarringHD`.
2. **Jalankan:** Klik dua kali file **`start.bat`**.
   *(Pada peluncuran pertama, command prompt akan mendownload engine scrcpy & adb secara otomatis, lalu membuka browser di `http://localhost:5050`)*.
3. **Aktifkan USB Debugging di HP:**
   - Buka **Setelan > Tentang Ponsel** di HP kamu.
   - Ketuk **Build Number** 7 kali sampai muncul keterangan Opsi Pengembang aktif.
   - Buka **Setelan Tambahan > Opsi Pengembang**, lalu aktifkan **USB Debugging**.
4. **Hubungkan & Mainkan:**
   - Hubungkan HP ke PC menggunakan kabel USB.
   - Izinkan verifikasi Debugging USB yang muncul di layar HP Anda.
   - Klik **Scan Devices** di dashboard browser, pilih HP Anda, lalu klik **START SCREEN MIRROR**!

---

## 👥 Pembuat

Proyek ini dibuat dan dikembangkan sepenuhnya oleh **RyuuMachida**.

- **GitHub:** [@RyuuMachida](https://github.com/RyuuMachida)
- **TikTok:** [@rilss_ear1](https://www.tiktok.com/@rilss_ear1)

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT License** - bebas digunakan dan dimodifikasi untuk kebutuhan personal maupun komersial. Selengkapnya bisa dicek di berkas [LICENSE](LICENSE).

*Hak Cipta & Paten Terdaftar atas nama **RyuuMachida**. Dilarang mendistribusikan ulang atau mengganti nama (rebrand) proyek ini tanpa mencantumkan atribusi pencipta asli.*
