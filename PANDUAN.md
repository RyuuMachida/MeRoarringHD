# Panduan Menjalankan MeRoarringHD

MeRoarringHD adalah aplikasi screen mirroring real-time beresolusi tinggi (HD) yang menyalurkan tampilan layar serta audio dari HP Android ke laptop/PC secara bersamaan, sekaligus mematikan suara speaker pada HP Anda.

> [!IMPORTANT]
> **PENTING:** Anda **tidak boleh** membuka file `public/index.html` secara langsung di browser (seperti menggunakan klik ganda file HTML). Jika Anda membukanya langsung via `file://`, semua tombol, scan device, dan konfigurasi **tidak akan berfungsi** karena browser tidak dapat terhubung ke sistem ADB (Android Debug Bridge) di laptop Anda tanpa server backend Node.js yang berjalan.

---

## Persyaratan Sistem
1. **Node.js**: Pastikan laptop Anda sudah terinstal Node.js. Jika belum, download di [nodejs.org](https://nodejs.org/).
2. **Android 11 atau lebih baru**: Fitur pengiriman suara (audio forwarding) secara bawaan membutuhkan Android 11+.
3. **Kabel Data USB**: Gunakan kabel data berkualitas yang mendukung transfer data (bukan sekadar kabel charger saja).

---

## Cara Menjalankan Aplikasi

1. **Jalankan Aplikasi via `start.bat`:**
   - Buka folder `MeRoarringHD`.
   - Klik dua kali (double-click) pada file **`start.bat`**.
   - Jendela Command Prompt akan muncul. Jika ini pertama kali dibuka, ia akan otomatis menginstal library pendukung (`npm install`) dan mengunduh program mirroring (`scrcpy` & `adb`) dari repositori resmi.
   - Setelah selesai, dashboard web kontrol akan **terbuka otomatis** di browser Anda pada alamat `http://localhost:5050`.

2. **Siapkan HP Android Anda (USB Debugging):**
   - Di HP Anda, buka **Pengaturan > Tentang Ponsel** (About Phone).
   - Ketuk **Nomor Versi** (Build Number) sebanyak 7 kali berturut-turut hingga muncul pesan "Anda sekarang adalah pengembang!".
   - Kembali ke menu utama Pengaturan, masuk ke **Sistem > Opsi Pengembang** (Developer Options).
   - Cari opsi **USB Debugging** (Debugging USB) lalu aktifkan.

3. **Hubungkan HP ke Laptop:**
   - Hubungkan HP menggunakan kabel USB ke laptop.
   - Lihat layar HP Anda. Jika muncul pop-up peringatan **"Izinkan Debugging USB?"** (Allow USB Debugging?), centang opsi **"Selalu izinkan dari komputer ini"** lalu pilih **Izinkan** (Allow).

4. **Mulai Mirroring:**
   - Pada halaman dashboard web di browser Anda (`http://localhost:5050`), klik tombol **Scan Devices**.
   - Nama kode HP Anda akan muncul di dalam menu pilihan (dropdown) **Select Active Device**.
   - Sesuaikan pengaturan jika perlu (misalnya resolusi, framerate, atau aktifkan **"Turn Off Phone Screen"** untuk mematikan layar HP saat mirroring agar HP tidak panas dan hemat baterai).
   - Klik tombol besar berwarna ungu **START SCREEN MIRROR**.
   - Layar HP Anda akan muncul secara instan di laptop Anda lengkap dengan suaranya! Untuk berhenti, klik **STOP STREAMING** atau tutup jendela mirroring.

---

## Panduan Pemecahan Masalah (Troubleshooting)

### 1. Kenapa HP saya tidak muncul di pilihan setelah klik "Scan Devices"?
* **Kabel USB tidak mendukung transfer data**: Coba gunakan kabel USB lain atau colokkan ke port USB lain di laptop.
* **Opsi USB Debugging belum aktif**: Pastikan Anda sudah mengaktifkannya di Opsi Pengembang di HP.
* **Izin Debugging belum disetujui di HP**: Pastikan layar HP Anda menyala (tidak terkunci) saat menghubungkan kabel, lalu izinkan akses debugging pada pop-up yang muncul.

### 2. Kenapa tombol-tombol di web tidak merespon saat diklik?
* Pastikan Anda mengakses alamat **`http://localhost:5050`** di browser, **bukan** langsung membuka file `public/index.html`. Jika jendela browser tidak terbuka otomatis, jalankan `start.bat` terlebih dahulu, lalu ketik `http://localhost:5050` di browser Anda secara manual.

### 3. Gambar terkirim, tapi suara tetap keluar di HP atau tidak ada suara di laptop?
* Suara hanya dapat disalurkan secara otomatis pada versi **Android 11 ke atas**. Jika versi Android Anda di bawah 11, suara akan tetap dimainkan di HP.
* Pastikan HP Anda berada dalam kondisi layar terbuka (unlocked) saat memulai mirror agar server audio Android dapat terhubung.
