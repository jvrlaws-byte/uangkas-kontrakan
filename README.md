# 🏠 Aplikasi Uang Kas Kontrakan (Javier Admin & Mode Teman)

Aplikasi manajemen uang kas dan pencatatan pengeluaran kontrakan yang dapat digunakan bersamaan di **Laptop**, **Semua HP Android (Poco, Samsung, Xiaomi, dll.)**, dan **iPhone (Apple iOS)** secara real-time.

---

## 👥 Anggota Kontrakan
1. **Bayu**
2. **Apip**
3. **Mazyan**
4. **Rayyan**
5. **Dholla**
6. **Javier** (Admin & Bendahara)

---

## 🔐 Hak Akses: Admin (Javier) vs Teman Kontrakan (Viewer)

Aplikasi ini memiliki sistem otorisasi peran (Role-Based Access Control):
- **Javier (Admin)**: Memiliki hak penuh untuk mencatat pengeluaran, mengubah status lunas/belum iuran kas per minggu, mengeksekusi target martabak, dan mengelola anggota.
  - *Default PIN Admin*: **`1234`**
- **Teman-Teman Kontrakan (Mode Lihat)**:
  - Dapat melihat dashboard arus kas (saldo, pemasukan, pengeluaran).
  - Dapat melihat **Target Martabak Rp 50.000** dan status progressnya.
  - Dapat melihat matriks status pembayaran kas mereka sendiri (apakah sudah lunas atau ada tunggakan).
  - Dapat melihat rincian buku pengeluaran kontrakan (kapan beli galon air, sabun, tissue, gas).
  - Dapat mengunduh laporan bulanan **PDF** dan **Excel**.
  - **TIDAK BISA** mengubah, menambah, atau menghapus data tanpa memasukkan PIN Admin Javier.

---

## 📋 Aturan Kas & Periode 4 Minggu

1. **Aturan 4 Minggu per Bulan:**
   - Periode kas per bulan **hanya 4 minggu** (Minggu 1, Minggu 2, Minggu 3, Minggu 4).
   - Iuran: **Rp 5.000 / minggu per orang** = **Rp 20.000 / bulan per orang**.
   - Total estimasi pemasukan per bulan dari 6 anggota = **Rp 120.000 / bulan**.

2. **Pengeluaran Kas HANYA Digunakan Untuk:**
   - 💧 **Isi Ulang Air**: **Rp 5.000** (Rutin Senin & Rabu).
   - 🧼 **Sabun Cuci Piring** (Sunlight / Mama Lemon).
   - 🧻 **Tissue** (Tissue dapur / gulung).
   - ⛽ **Gas** (Gas LPG 3kg).
   - 🥞 **Target Martabak**: Jika ada saldo menganggur sekitar **Rp 50.000**, otomatis ada target beli martabak bareng anak kontrakan!
   - 📦 **Lain-lainnya** (kebutuhan bersama yang disepakati).

3. **Shortcut Cepat 1-Klik:**
   - `💧 + Air Rp 5.000 (Senin)`
   - `💧 + Air Rp 5.000 (Rabu)`
   - `🧼 + Sabun Cuci Piring`
   - `🧻 + Tissue`
   - `⛽ + Gas LPG`
   - `🥞 + Martabak Rp 50.000`

---

## 📱 Panduan Pemasangan di Device (Android & iPhone iOS)

### 1. Untuk Semua HP Android (Poco, Samsung, Xiaomi, Oppo, Vivo, dll.)
1. Hubungkan HP ke WiFi yang sama dengan laptop.
2. Buka Google Chrome di HP dan masukkan alamat: `http://192.168.1.45:3000` (atau scan QR code dari layar laptop).
3. Klik tombol **"Install App"** yang muncul di layar, atau buka menu titik 3 Chrome (⋮) -> pilih **"Install Aplikasi" / "Tambahkan ke Layar Utama"**.
4. Aplikasi langsung terpasang di HP Android kamu!

### 2. Untuk iPhone & iPad (Apple iOS)
1. Buka browser **Safari** di iPhone dan buka alamat `http://192.168.1.45:3000` (atau scan QR code dengan kamera iPhone).
2. Tekan tombol **Share** (ikon kotak dengan panah ke atas) di bagian bawah Safari.
3. Gulir ke bawah dan pilih **"Add to Home Screen (Tambahkan ke Layar Utama)"**.
4. Ikon **Kas Kontrakan 🏠** akan muncul di layar utama iPhone dan berjalan full-screen!

---

## 🚀 Cara Menjalankan

Di laptop cukup jalankan:
```bash
npm start
```
Akses di browser laptop: **http://localhost:3000**
Akses di HP: **http://192.168.1.45:3000**
