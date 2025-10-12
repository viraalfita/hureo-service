# Attendance Service (Express + MongoDB)

RESTful API backend untuk sistem absensi karyawan.  
Dibangun menggunakan **Express.js**, **MongoDB (Mongoose)**, dan **Day.js** untuk mendukung aplikasi **Attendance Web** dan **Attendance Mobile**.

## 🚀 Features

- **Autentikasi & Manajemen Pengguna**
  - Registrasi admin dan karyawan.
  - Login pengguna.
  - Ambil data semua user atau berdasarkan perusahaan.
  - Hapus pengguna.

- **Manajemen Perusahaan**
  - Registrasi perusahaan baru dengan **Google Maps API (RapidAPI)** untuk validasi alamat.
  - Update informasi perusahaan (nama, alamat, jam kerja, radius lokasi).
  - Ambil informasi jam kerja perusahaan.
  - Ambil data semua perusahaan atau berdasarkan `companyCode`.

- **Absensi (Check-in & Check-out)**
  - Validasi lokasi dengan **geofencing** (Haversine formula).
  - Validasi jam masuk (timeStart + graceMinutes).
  - Menyimpan status keterlambatan (`late`).
  - Endpoint untuk semua absensi, per user, per perusahaan, atau khusus hari ini.

- **Cuti**
  - Ajukan cuti (dengan validasi overlap).
  - Approve / decline cuti.
  - Batalkan cuti (jika status masih *waiting*).
  - Ambil semua cuti, per user, atau per perusahaan.

## 📦 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Time Handling**: [Day.js](https://day.js.org/)
- **Maps API**: [Google Map Places API (via RapidAPI)](https://rapidapi.com/)

## 🔗 Related Repositories

- **Frontend Web Dashboard (Vue 3)**  
  👉 [my-attendance-app](https://github.com/viraalfita/my-attendance-app)

- **Mobile App (Flutter)**  
  👉 [attendance (Mobile)](https://github.com/viraalfita/attendance)

## ⚙️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/viraalfita/attendance-service.git
cd attendance-service
````

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

API tersedia di:

```
http://localhost:5001/api
```

## 📚 API Endpoints (Ringkasan)

### Auth

* `POST /api/auth/register/employee`
* `POST /api/auth/register/admin`
* `POST /api/auth/login`
* `GET /api/auth/` → semua user
* `GET /api/auth/company/:companyId` → user per perusahaan
* `DELETE /api/auth/:id` → hapus user

### Company

* `POST /api/companies/register`
* `PATCH /api/companies/:id`
* `GET /api/companies/` → semua perusahaan
* `GET /api/companies/:companyCode`
* `GET /api/companies/hours/:companyCode`

### Attendance

* `POST /api/attendance/checkin`
* `POST /api/attendance/checkout`
* `GET /api/attendance/` → semua absensi
* `GET /api/attendance/:userId` → absensi per user
* `GET /api/attendance/company/:companyId`
* `GET /api/attendance/today/:userId`
* `GET /api/attendance/company/:companyId/today`

### Leaves

* `POST /api/leaves/`
* `GET /api/leaves/`
* `GET /api/leaves/:userId`
* `PATCH /api/leaves/:id/status`
* `DELETE /api/leaves/:id`

## 📸 Architecture

```
Frontend (Vue) <-> Express API <-> MongoDB
Mobile (Flutter)
```

## 👤 Author

Developed by **Vira Alfita (TI 3C, Politeknik Negeri Malang)**
Part of integrated system: **Web Dashboard + Express Backend + Mobile Flutter Attendance**
