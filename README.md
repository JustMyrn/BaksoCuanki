# BaksoCuanki

Web app dengan frontend React + Vite dan backend Express + PostgreSQL.

## Struktur Project

- `client/` - frontend React untuk landing, login, dan signup.
- `server/` - backend Express dengan endpoint auth dan approval.

## Prasyarat

- Node.js 18+.
- PostgreSQL.
- pgAdmin atau tool SQL lain untuk menjalankan schema.

## Setup Database

1. Buat database PostgreSQL baru, misalnya `integra`.
2. Buka file `server/schema.sql`.
3. Jalankan isi SQL tersebut di pgAdmin Query Tool atau lewat psql.

Schema ini akan membuat tabel `users` yang dipakai untuk login, signup, onboarding, dan approval admin.

## Konfigurasi Server

Buka `server/.env`, lalu pastikan nilainya sesuai dengan PostgreSQL milikmu.

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

- `POST /api/auth/register`
- `POST /api/auth/login`

### User

- `GET /api/me`
- `POST /api/profile`
- `GET /api/dashboard`

### Admin

- `GET /api/admin/users`
- `POST /api/admin/users/:id/approve`

## Contoh Request Login/Register

### Register

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Catatan Penting

- Password disimpan sebagai hash, bukan plaintext.
- Akun baru akan berstatus pending sampai melewati proses onboarding dan approval admin.
- Jika frontend dan backend jalan di port berbeda, CORS sudah diaktifkan di server.
