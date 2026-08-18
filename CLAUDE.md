# INTEGRA - KONTEKS PROYEK LENGKAP

> File ini otomatis dibaca oleh Cline di setiap task baru. Update jika ada perubahan signifikan.
> Terakhir diupdate: 17 Agustus 2026

---

## 📌 GAMBARAN UMUM

**INTEGRA** = Aplikasi web KEMENHAM Kanwil Lampung untuk mengelola **Surat Perjalanan Dinas (SPD)** pegawai secara digital: registrasi, pengisian data diri, approval admin, form perjalanan dinas dengan fitur **kamera anti-fraud**.

---

## 📁 STRUKTUR PROYEK

```
BaksoCuanki/
├── CLAUDE.md                          ← File ini
├── client/                            ← React + Vite + Tailwind CSS 4
│   ├── src/
│   │   ├── App.jsx                    ← Router & autentikasi
│   │   ├── main.jsx                   ← Entry point
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignUpPage.jsx
│   │   │   ├── IsiDataDiriPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AlurPengisianPage.jsx
│   │   │   ├── PreEventPage.jsx       ← PALING KOMPLEKS (kamera + GPS)
│   │   │   ├── PreEventFinalPage.jsx        ← Nominal biaya, nota, foto titik (kamera)
│   │   │   ├── EventAlurPengisianPage.jsx   ← Alur Event (2 card aktif)
│   │   │   └── PageProfile.jsx
│   │   └── admin/
│   │       ├── AdminApp.jsx
│   │       ├── AdminLoginPage.jsx        ← Desktop1_LandingPageLogin (sidebar + kartu login)
│   │   └── assets/logo-kemenham.png
│   ├── index.html, vite.config.js, package.json
├── server/
│   ├── index.js                       ← Express API
│   ├── db.js                          ← PostgreSQL connection
│   ├── schema.sql                     ← DDL (+username kolom)
│   ├── setup-test-spd.js              ← Approve user + buat SPD
│   ├── setup-pangkat.js               ← Tambah kolom pangkat_golongan
│   ├── setup-admin.js                 ← Buat admin (username=Admin, pwd=adminkemenham@2026)
│   ├── fill-test-profile.js           ← Isi profile test@test.com
│   └── .env, package.json
```

---

## 🛠 TEKNOLOGI

- **Frontend:** React 19 + Vite 5 + Tailwind CSS 4 + @fontsource/aoboshi-one (font desktop)
- **Backend:** Express 4 + PostgreSQL
- **Autentikasi:** JWT (jsonwebtoken), password PBKDF2/SHA-512
- **Upload:** Multer (server-side)
- **Port:** Frontend `5173` | Backend `5000`
- **Database:** PostgreSQL lokal (`integrasi_perjalanan_dinas`)

---

## 🧭 ALUR NAVIGASI (State-based Router, Hash untuk Admin)

```
Pegawai (mobile): Landing → Login/SignUp → IsiDataDiri
  → Dashboard → AlurPengisian → PreEvent → PreEventFinal → Event → (PostEvent coming soon)

Admin (desktop): /#/admin → Login (AdminLoginPage) → Dashboard → Desktop2 → Desktop3...

PageProfile ← dari semua halaman via klik ikon profile header
```

---

## 📝 HALAMAN (10 halaman sudah jadi)

### 1. LandingPage.jsx
Navbar (Tentang, SOP, Tutorial), Logo KEMENHAM, judul "SIMPEL DIY", tombol Log In (outline) & Sign Up (solid).

### 2. LoginPage.jsx
Form email + password. Demo mode: `demo@integra.id` / `demo1234` tetap bisa masuk saat backend mati. Alur: POST /api/login → simpan token + user → cek onboarding_status. Jika profile_required → IsiDataDiri, jika approved → Dashboard.

### 3. SignUpPage.jsx
Form email + password + confirm. POST /api/register → onboarding_status='profile_required' → IsiDataDiri.

### 4. IsiDataDiriPage.jsx
Form: Nama Lengkap, NIP, Jabatan, Pangkat/Golongan. POST /api/profile (Bearer). Simpan → Dashboard.

### 5. DashboardPage.jsx
Fetch /api/me + /api/perjalanan-dinas. Dua varian: (1) Ada SPD → tampil surat + Next, (2) Tidak ada SPD → "Maaf, Tidak Ada Surat Perjalanan Dinas Aktif". Header: Logo kiri + Profile kanan (klik → PageProfile).

### 6. AlurPengisianPage.jsx
Judul "Alur Pengisian", 3 card bertahap: Pre-Event (aktif #73B1D8), Event & Post-Event (non-aktif #D5E8FA opacity 60%). Step indicator (1)→(2)→(3).

### 7. PreEventPage.jsx ⭐ PALING KOMPLEKS
Form perjalanan dinas pre-event. Field muncul **bertahap tanpa tombol Next**.

**Field & Logika:**
- **Tujuan Perjalanan** (input, selalu tampil)
- **Tempat Pelaksanaan** (input, selalu tampil)
- **Transportasi** (dropdown Umum/Pribadi, selalu tampil)
- **Detail Transportasi** (dropdown, muncul setelah pilih jenis): Umum→Mobil/Bus/Kereta/Pesawat, Pribadi→Mobil/Motor. Label dinamis.
- **Kapal Laut** (radio Ya/Tidak, muncul jika detailTransportasi termasuk KAPAL_BY_JENIS): `{ Umum: ['Mobil','Bus','Kereta'], Pribadi: ['Mobil','Motor'] }`. State: null|true|false. Radio lingkaran custom.
- **Kebutuhan Tambahan** (checkbox, muncul setelah detail): Sewa Kendaraan, Taxi/Ojek, E-Money, Lainnya. Checkbox persegi custom.
- **Upload Tiket** (muncul setelah detail): tombol "Ambil Gambar" → modal izin → kamera. Bisa >1 foto.
- **Nominal Biaya** (input, muncul setelah detail)
- Tombol Back & Next. Validasi: `tujuan.trim() && tempat.trim() && jenisTransportasi && detailTransportasi`

### 8. PageProfile.jsx
Header: Back button (kiri) + Logo KEMENHAM (tengah) — **beda dari halaman lain**. Info profil dari /api/me. Tombol Logout merah → hapus semua localStorage → Landing.


---

## 🎥 FITUR KAMERA (PreEventPage) — WAJIB COPY-PASTE PERSIS

**Alur:**
1. Klik "Ambil Gambar" → modal izin ⚠️ "Izinkan Akses Kamera & Lokasi"
2. Klik "Mulai" → `navigator.mediaDevices.getUserMedia()`
3. Kamera live preview fullscreen hitam
4. Tombol capture bulat putih + Batal (merah)
5. Status text pojok kiri atas

**Spesifikasi Teknis (JANGAN DIUBAH):**
```javascript
// Stream di useRef, BUKAN useState
const cameraStreamRef = useRef(null);
const [streamReady, setStreamReady] = useState(false);

// Cleanup di useEffect unmount saja
useEffect(() => {
  return () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };
}, []);

// Constraints mobile-first:
// 1: { video: { facingMode: 'environment', width: {ideal:1280}, height: {ideal:720} } }
// 2: { video: { width: {ideal:1280}, height: {ideal:720} } }
// 3: { video: true }
```

**Watermark Anti-Fraud (server time):**
- Waktu dari **server** (`GET /api/time`), bukan dari jam device user → **tidak bisa dipalsukan**
- Format: `DD-Bln-YYYY HH:MM:SS WIB\nGPS: lat, lng (akurasi: Xm)` atau `(GPS tidak tersedia)`
- Font: bold `Math.max(16, Math.floor(vw / 40))` px, putih 85% + stroke hitam
- Posisi: kanan bawah (right-aligned, bottom-aligned)
- Return: `{ dataUrl, lat, lng, accuracy, timestamp }`

**GPS:** `enableHighAccuracy: true`, timeout 10 detik. `fetchServerTime()` + `getGps()` dipanggil paralel via `Promise.all`. Akurasi GPS disimpan di field `accuracy` (dalam meter). Foto tetap terambil walau GPS/server gagal (fallback ke `formatTimestamp(new Date())`).

**Error Kamera:**
- NotAllowedError → "Akses kamera ditolak" + tombol Coba Lagi
- NotFoundError/OverconstrainedError → coba constraint berikutnya
- Semua gagal → "Tidak ada kamera yang tersedia"

**State yang harus ada:** cameraStreamRef, streamReady, showIzinModal, showCamera, cameraStatus, cameraDenied, videoRef, canvasRef, fotoList (array `{ dataUrl, lat, lng, accuracy, timestamp }`)



---

## 🔐 AUTENTIKASI & SESI

### JWT: Expiry 8 jam (`expiresIn: '8h'`), key dari `.env` (`JWT_SECRET`), simpan di localStorage `integra_token`.

### Auto-restore (App.jsx): useEffect validasi /api/me saat mount. Jika 401 → hapus localStorage → Landing.

### Demo Mode:
- Akun: `demo@integra.id` / `demo1234`
- Flag: `integra_demo_mode` di localStorage
- Token: `demo-token` (tidak divalidasi backend)
- Trigger: backend mati / network error

### localStorage Keys:
| Key | Value |
|-----|-------|
| `integra_token` | JWT atau `demo-token` |
| `integra_user` | `{ fullName, nip, jabatan, pangkatGolongan, onboardingStatus }` |
| `integra_demo_mode` | `"true"` |
| `integrasi_data_diri` | legacy, `{ namaLengkap, nip, jabatan, pangkatGolongan }` |
| `integra_surat_list` | `[{ nama, url }]` |

---

## 🗄 DATABASE

### Tabel `users`
id (BIGSERIAL PK), email (TEXT UNIQUE), password_hash (TEXT PBKDF2), full_name, nip, jabatan, pangkat_golongan, is_admin (BOOL), onboarding_status (registered/profile_required/pending_approval/approved), approval_status (pending/approved/rejected), created_at

### Tabel `perjalanan_dinas`
user_id (FK), tujuan_perjalanan, tempat_pelaksanaan, jenis_transportasi (umum/pribadi), detail_transportasi, gunakan_kapal_laut (BOOL), kebutuhan_bbm/bbm_tol/parkir/lainnya (BOOL), tiket_transportasi_url, nominal_biaya_tiket


---

### 8. PreEventFinalPage.jsx
Konfirmasi & finalisasi data pre-event. Terima prop `{ onBack, onNext, onSave, onOpenProfile, preEventData, submitted }`. Fokus: **nominal biaya tambahan**, **upload nota kebutuhan**, **foto/selfie di titik awal** (kamera + GPS). Fitur kamera anti-fraud dipakai ulang dari PreEventPage.

**Logika & State:**
- `biayaItems` = item kebutuhan standar (kecuali `'Lainnya'`) + item custom dari `lainnyaItems`; masing2 punya input nominal di `biayaTambahan`
- Validasi sebelum Save: wajib isi nominal semua biaya, wajib `notaList` (jika ada kebutuhan tambahan), wajib minimal 1 `fotoTitikList`. Missing → `formError` "Lengkapi: …"
- **Save Popup "⚠️ Konfirmasi Penyimpanan"**: data yang disimpan **tidak dapat diubah lagi**; tombol "Ya, Simpan" (call `onSave`) vs "Batal"
- Kamera: `startCamera` → `navigator.mediaDevices.getUserMedia`, prioritas `facingMode:'environment'` (kamera belakang) di mobile; `releaseStream` + stop semua track `cameraStreamRef.current` saat unmount
- Auto-save draft ke localStorage `integra_pre_event_final_draft`
- Saat `submitted` = read-only; tombol kiri = `Kembali`, kanan = `Next`

### 9. EventAlurPengisianPage.jsx
Halaman alur pengisian **Event** (tahap 2). Navbar Core UI (`bg-[#D5E8FA]`), judul header "Alur Pengisian", step indicator (1)→(2)→(3). Prop `{ onBack, onNavigate, onOpenProfile }`.
- Card 1 **Pre-Event** (completed `#D5E8FA`, bisa diklik) → `onNavigate('pre-event')`
- Card 2 **Event** (AKTIF `#73B1D8`) → sementara `onNavigate('dashboard')`
- Card 3 **Post-Event** (non-aktif `#D5E8FA` opacity-60, tidak bisa diklik)

---
## 🎨 UI KONVENSI

**Warna:** Primary #04305F | Profile #124CA3 | Active #73B1D8 | Inactive #D5E8FA | Input #D9D9D9 | Danger red
**Font:** Inter, font-bold/extrabold, clamp() sizing
**Layout:** `<div className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-white font-['Inter'] sm:max-w-md">`

**Header (Dashboard, AlurPengisian, PreEvent):** Logo KEMENHAM kiri (42-59px) + Profile kanan (label "Profile" #124CA3 + nama user hitam + SVG icon 37x37, gap-[5px])

**Header (PageProfile) — BEDA:** Back button kiri + Logo tengah, TANPA profile section

---

## 📋 API ENDPOINTS

| POST `/api/register` | `{email,password}` → `{user}` |
| GET `/api/time` | ✗ | → `{ iso, unixMs, wib }` (server time, anti-fraud) |
| POST `/api/login` | `{username \| email, password}` → `{token,user}` |
| GET `/api/me` | Bearer → `{user}` |
| POST `/api/profile` | Bearer, `{fullName,nip,jabatan,pangkatGolongan}` → `{user}` |
| POST `/api/perjalanan-dinas` | Bearer, FormData (multer) → `{perjalanan}` |
| GET `/api/perjalanan-dinas` | Bearer → `{perjalanan}` |
| POST `/api/approve/:id` | Bearer (admin) → `{user}` |

---

## 🏷 AKUN TEST

| test@test.com | 12345678 | Approved + SPD sample |
| demo@integra.id | demo1234 | Demo mode |
| Admin (admin@integra.id) | adminkemenham@2026 | Admin |

---

## ⚠️ RULES OF HOOKS

**Semua useState/useEffect HARUS di atas conditional return di App.jsx.**
```jsx
// BENAR: semua hook di atas
function App() { const [page,setPage]=useState('landing'); useEffect(()=>{},[]); if(page==='landing') return <Landing/>; }

// SALAH: hook setelah conditional return → CRASH
function App() { const [page,setPage]=useState('landing'); if(page==='landing') return <Landing/>; const [user,setUser]=useState(null); }
```

---

## 🔧 PERINTAH
cd server && node setup-admin.js       # Buat akun admin

```bash
cd server && npm install && npm run dev     # http://localhost:5000
cd client && npm install && npm run dev     # http://localhost:5173
cd server && node setup-pangkat.js          # Tambah kolom
cd server && node setup-test-spd.js          # Approve + buat SPD
cd server && node fill-test-profile.js       # Isi profile test
```

---

## 📐 FIGMA

- File Key: `ZoxiubwYkcsRa1yep9OekB` | Nama: "INTEGRA"
- Node Mobile: `2080:13` | Dimensi: 390x844 (iPhone 13/14)
- Canvas: Desktop + Mobile

---

## 🔴 CATATAN PENTING

1. **Fitur kamera dipakai ulang** di Event & PostEvent — copy-paste persis pola PreEventPage
2. **Form bertahap** tanpa Next adalah pola UX utama
3. **State di-pass via onNavigate callback** (bukan Redux/Context)
4. **Header NAVBAR CORE UI:** `bg-[#D5E8FA] px-6 py-[18px]`, flex items-center justify-between, Logo kiri + Profile kanan (gap-[5px]). Judul di dalam header (mt-[10px], 14px, #04305F). PageProfile: Back button + "Profile" text.
5. **Multer** untuk upload file, FormData field `tiket_transportasi`
6. **Demo mode harus tetap berfungsi** — fallback di setiap API call baru

---

## 📊 STATUS

| Landing ✅ | Login ✅ | SignUp ✅ | IsiDataDiri ✅ | Dashboard ✅ | AlurPengisian ✅ | PreEvent ✅ | PageProfile ✅ | PreEventFinal ✅ | EventAlurPengisian ✅ | AdminLogin ✅ |
| EventForm ❌ | PostEvent ❌ | AdminDashboard ❌ |

