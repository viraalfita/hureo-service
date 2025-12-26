# HUREO HRIS Service (Express + MongoDB)

RESTful API backend untuk sistem **manajemen absensi dan karier karyawan**.
Dibangun menggunakan **Express.js**, **MongoDB (Mongoose)**, dan **Day.js** untuk mendukung integrasi dengan **Attendance Web Dashboard** dan **Attendance Mobile App**.

---

## 🚀 Features

### 🔐 Autentikasi & Manajemen Pengguna

* Registrasi dan login untuk **admin** & **karyawan**.
* Pengelolaan akun berdasarkan perusahaan (multi-tenant).
* Token-based authentication menggunakan **JWT**.

### 🏢 Manajemen Perusahaan

* Registrasi perusahaan baru dengan validasi alamat via **Google Maps API (RapidAPI)**.
* Pengaturan profil perusahaan: nama, alamat, jam kerja, dan radius lokasi.
* Mendukung **jam kerja dinamis** per cabang.

### 🕓 Absensi (Check-in / Check-out)

* Validasi lokasi menggunakan **geofencing (Haversine formula)**.
* Validasi jam masuk.
* Deteksi otomatis status “late” dan penyimpanan riwayat absensi.
* Sinkronisasi penuh dengan **mobile app (Flutter)** dan **web dashboard (Vue)**.

### 🗓️ Cuti & Izin

* Pengajuan, persetujuan, dan pembatalan cuti.
* Validasi tumpang tindih (*overlap validation*).
* Sinkronisasi status cuti antar platform (mobile & web).

### 💼 Karir & Rekrutmen

* Manajemen **posisi/jabatan** dalam perusahaan.
* Modul **rekrutmen digital**: lowongan, pelamar, dan tahapan seleksi.
* Integrasi langsung dengan frontend untuk **KPI dan performa karyawan**.

---

## 🔗 Related Repositories

* **Frontend Web Dashboard (Vue 3)**
  👉 [Hureo Web](https://github.com/viraalfita/hureo-web)

* **Mobile App (Flutter)**
  👉 [Hureo App (Only for Employee Attendance)](https://github.com/viraalfita/hureo-app)

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/viraalfita/attendance-service.git
cd attendance-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` di root project:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/attendance
JWT_SECRET=your-secret-key
RAPIDAPI_KEY=your-rapidapi-key
```

### 4. Jalankan Server

```bash
npm run dev
```

API berjalan di:

```
http://localhost:5001/api
```

---

## 🧩 Architecture Overview

```
Frontend (Vue) <-> Express API <-> MongoDB
            ↕
        Mobile (Flutter)
```
