# BaksoCuanki

By :
- Najwa Syahirah Rosyan
- Omar Athaya Vito
- Ibrahim Budi Satria

Web app dengan frontend React + Vite dan backend Express + PostgreSQL.

## Struktur Project

- `client/` - frontend React untuk landing, login, signup, dan modul lainnya.
- `server/` - backend Express dengan autentikasi, manajemen profile user, approval admin, dan modul perjalanan dinas.

## Prasyarat

- Node.js 18+.
- PostgreSQL.
- pgAdmin atau tool SQL lain untuk menjalankan schema.

## Setup Database

1. Buat database PostgreSQL baru, misalnya `integra`.
2. Buka file `server/schema.sql`.
3. Jalankan isi SQL tersebut di pgAdmin Query Tool atau lewat psql.

Schema ini akan membuat dua tabel utama:
- `users`: Tabel pengguna (termasuk data `jabatan`, status onboarding, dan status approval admin).
- `perjalanan_dinas`: Tabel detail pengajuan perjalanan dinas (tujuan, transportasi umum/pribadi, opsi kapal laut, kebutuhan tambahan, tiket, & biaya).

> **Catatan Pembaruan Database:**  
> Jika database sudah dibuat sebelumnya, tambahkan kolom `jabatan` pada tabel `users` dengan query:
> ```sql
> ALTER TABLE users ADD COLUMN IF NOT EXISTS jabatan TEXT;
> ```
> Kemudian jalankan skema tabel `perjalanan_dinas` dari `server/schema.sql`.

## Konfigurasi Server

Buka `server/.env`, lalu pastikan nilainya sesuai dengan konfigurasi PostgreSQL milikmu.

Contoh format:

```env
PORT=5000
JWT_SECRET=your-secret-key
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=integra
```

## Cara Menjalankan Backend

```powershell
cd server
npm install
npm run dev
```

Backend akan berjalan di `http://localhost:5000`.

## Cara Menjalankan Frontend

```powershell
cd client
npm install
npm run dev
```

Frontend Vite biasanya berjalan di `http://localhost:5173`.

## Endpoint Backend

### Auth
- `POST /api/auth/register` - Registrasi akun baru
- `POST /api/auth/login` - Login pengguna

### User & Profile
- `GET /api/me` - Ambil profil pengguna yang sedang login
- `POST /api/profile` - Lengkapi/update profil (`fullName`, `nip`, `jabatan`)
- `GET /api/dashboard` - Cek akses dashboard pengguna

### Perjalanan Dinas
- `POST /api/perjalanan-dinas` - Buat pengajuan perjalanan dinas baru
- `GET /api/perjalanan-dinas` - Ambil daftar perjalanan dinas milik pengguna login
- `GET /api/perjalanan-dinas/:id` - Ambil detail 1 perjalanan dinas berdasarkan ID
- `PUT /api/perjalanan-dinas/:id` - Update data perjalanan dinas
- `DELETE /api/perjalanan-dinas/:id` - Hapus data perjalanan dinas

### Admin
- `GET /api/admin/users` - Ambil daftar semua user (bisa filter query `?status=pending`)
- `POST /api/admin/users/:id/approve` - Approve pendaftaran user
- `GET /api/admin/perjalanan-dinas` - Ambil daftar seluruh pengajuan perjalanan dinas semua user

---

## Contoh Format Request Body

### 1. Update Profile (`POST /api/profile`)
```json
{
  "fullName": "Budi Santoso",
  "nip": "199001012022011001",
  "jabatan": "Manager Operasional"
}
```

### 2. Buat Perjalanan Dinas (`POST /api/perjalanan-dinas`)
```json
{
  "tujuanPerjalanan": "Rapat Koordinasi Cabang",
  "tempatPelaksanaan": "Surabaya",
  "jenisTransportasi": "pribadi",
  "detailTransportasi": "mobil",
  "gunakanKapalLaut": false,
  "kebutuhanBbm": true,
  "kebutuhanBiayaTol": true,
  "kebutuhanParkir": true,
  "kebutuhanLainnya": false,
  "tiketTransportasiUrl": "https://example.com/uploads/tiket.pdf",
  "nominalBiayaTiket": 1500000
}
```
*Catatan:*
- `jenisTransportasi`: `"umum"` atau `"pribadi"`.
- `detailTransportasi`:
  - Untuk `"umum"`: `"mobil"`, `"bus"`, `"kereta"`, `"pesawat"`.
  - Untuk `"pribadi"`: `"mobil"`, `"motor"`.

---

## Catatan Penting

- Password disimpan sebagai hash PBKDF2.
- Akun baru berstatus `pending` sampai melewati proses onboarding profil dan diapprove oleh admin.
- CORS sudah diaktifkan di server backend.
