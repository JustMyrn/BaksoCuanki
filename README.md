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

### Upload
- `POST /api/upload/tiket` - Upload foto tiket transportasi (dari kamera). Field name: `tiket`. Format: `multipart/form-data`. Maks 10 MB. Tipe yang didukung: JPEG, PNG, WebP, HEIC.

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

### 2. Upload Foto Tiket (`POST /api/upload/tiket`)

Foto tiket diambil langsung dari kamera perangkat (bukan dari galeri). Kirim sebagai `multipart/form-data`:

```
Content-Type: multipart/form-data
Field name: tiket
```

Response:
```json
{
  "message": "Tiket uploaded successfully",
  "tiketUrl": "http://localhost:5000/uploads/tiket/tiket_1_1722300000000.jpg",
  "filename": "tiket_1_1722300000000.jpg"
}
```

Gunakan nilai `tiketUrl` dari response sebagai `tiketTransportasiUrl` saat membuat perjalanan dinas.

### 3. Buat Perjalanan Dinas (`POST /api/perjalanan-dinas`)
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
  "tiketTransportasiUrl": "http://localhost:5000/uploads/tiket/tiket_1_1722300000000.jpg",
  "nominalBiayaTiket": 1500000
}
```
*Catatan:*
- `jenisTransportasi`: `"umum"` atau `"pribadi"`.
- `detailTransportasi`:
  - Untuk `"umum"`: `"mobil"`, `"bus"`, `"kereta"`, `"pesawat"`.
  - Untuk `"pribadi"`: `"mobil"`, `"motor"`.
- `tiketTransportasiUrl`: URL yang didapat dari endpoint upload tiket.

---

## Alur Upload Tiket Transportasi

1. Frontend membuka halaman khusus untuk foto tiket.
2. Pengguna menekan tombol "Ambil Gambar" → frontend mengaktifkan kamera perangkat.
3. Pengguna mengambil foto → frontend mengirim foto ke `POST /api/upload/tiket`.
4. Backend menyimpan file di `server/uploads/tiket/` dan mengembalikan `tiketUrl`.
5. Frontend menggunakan `tiketUrl` tersebut saat mengirim data perjalanan dinas ke `POST /api/perjalanan-dinas`.

---

## Catatan Penting

- Password disimpan sebagai hash PBKDF2.
- Akun baru berstatus `pending` sampai melewati proses onboarding profil dan diapprove oleh admin.
- CORS sudah diaktifkan di server backend.
- File foto tiket disimpan di `server/uploads/tiket/` dan disajikan secara statis melalui `/uploads/tiket/`.
- Folder `server/uploads/` sudah di-exclude dari git (`.gitignore`).
