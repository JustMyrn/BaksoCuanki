const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const UPLOADS_DIR = path.join(__dirname, 'uploads', 'tiket');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const tiketStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `tiket_${req.auth.sub}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const uploadTiket = multer({
  storage: tiketStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, HEIC) are allowed'));
    }
  },
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const digest = crypto
    .pbkdf2Sync(password, salt, iterations, 64, 'sha512')
    .toString('hex');

  return `pbkdf2$sha512$${iterations}$${salt}$${digest}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const parts = String(storedHash).split('$');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const [, digestName, iterationsText, salt, digest] = parts;
  const iterations = Number(iterationsText);
  if (!digestName || !iterations || !salt || !digest) {
    return false;
  }

  const expectedBuffer = Buffer.from(digest, 'hex');
  const attempt = crypto
    .pbkdf2Sync(password, salt, iterations, expectedBuffer.length, 'sha512')
    .toString('hex');

  return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), expectedBuffer);
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      isAdmin: Boolean(user.is_admin),
      approvalStatus: user.approval_status,
      onboardingStatus: user.onboarding_status,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    nip: row.nip,
    jabatan: row.jabatan,
    pangkatGolongan: row.pangkat_golongan,
    isAdmin: Boolean(row.is_admin),
    onboardingStatus: row.onboarding_status,
    approvalStatus: row.approval_status,
    lastLoginAt: row.last_login_at,
    profileCompletedAt: row.profile_completed_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
}

app.get('/', (req, res) => {
  res.json({ message: 'Backend Server is running' });
});

// Endpoint moved below with proper auth

// Anti-fraud: server time endpoint (tidak bisa dipalsukan oleh user)
app.get('/api/time', (req, res) => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = (n) => String(n).padStart(2, '0');
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7 WIB
  res.json({
    iso: now.toISOString(),
    unixMs: now.getTime(),
    wib: `${pad(wib.getUTCDate())}-${months[wib.getUTCMonth()]}-${wib.getUTCFullYear()} ${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}:${pad(wib.getUTCSeconds())} WIB`,
  });
});

app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Email is invalid' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, onboarding_status, approval_status)
       VALUES ($1, $2, 'registered', 'pending')
       RETURNING id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status, last_login_at,
                 profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [email, passwordHash]
    );

    return res.status(201).json({
      message: 'Register success',
      user: mapUser(insertResult.rows[0]),
    });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const identifier = String(req.body.username || req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!identifier) {
      return res.status(400).json({ message: 'Username or email is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
              last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at
       FROM users
       WHERE email = $1 OR username = $1
       LIMIT 1`,
      [identifier]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const updateResult = await pool.query(
      `UPDATE users
       SET last_login_at = NOW(),
           onboarding_status = CASE
             WHEN onboarding_status = 'registered' THEN 'profile_required'
             ELSE onboarding_status
           END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
                 last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [user.id]
    );

    const updatedUser = updateResult.rows[0];
    const token = signAccessToken(updatedUser);
    const nextStep =
      updatedUser.approval_status === 'approved'
        ? 'dashboard'
        : updatedUser.onboarding_status === 'profile_required'
          ? 'profile'
          : 'approval_pending';

    return res.json({
      message: 'Login success',
      token,
      user: mapUser(updatedUser),
      nextStep,
    });
  })
);

app.get(
  '/api/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
              last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.auth.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: mapUser(result.rows[0]) });
  })
);

app.post(
  '/api/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const fullName = String(req.body.fullName || req.body.full_name || '').trim();
    const nip = String(req.body.nip || '').trim();
    const jabatan = String(req.body.jabatan || '').trim();
    const pangkatGolongan = String(req.body.pangkatGolongan || req.body.pangkat_golongan || '').trim();

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!nip) {
      return res.status(400).json({ message: 'NIP is required' });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1,
           nip = $2,
           jabatan = $3,
           pangkat_golongan = $4,
           onboarding_status = 'pending_approval',
           approval_status = 'pending',
           updated_at = NOW(),
           profile_completed_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, nip, jabatan, pangkat_golongan, is_admin, onboarding_status, approval_status,
                 last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [fullName, nip, jabatan, pangkatGolongan, req.auth.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'Profile saved',
      user: mapUser(result.rows[0]),
      nextStep: 'approval_pending',
    });
  })
);

app.post(
  '/api/admin/users/:id/approve',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const result = await pool.query(
      `UPDATE users
       SET approval_status = 'approved',
           onboarding_status = 'approved',
           approved_at = NOW(),
           approved_by = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
                 last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [req.auth.sub, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User approved',
      user: mapUser(result.rows[0]),
    });
  })
);

app.post(
  '/api/admin/users/:id/reject',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const result = await pool.query(
      `UPDATE users
       SET approval_status = 'rejected',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
                 last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User rejected',
      user: mapUser(result.rows[0]),
    });
  })
);


app.get(
  '/api/admin/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || '').trim();
    const params = [];
    let whereClause = '';

    if (status) {
      params.push(status);
      whereClause = 'WHERE approval_status = $1';
    }

    const result = await pool.query(
      `SELECT id, email, full_name, nip, jabatan, is_admin, onboarding_status, approval_status,
              last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    return res.json({ users: result.rows.map(mapUser) });
  })
);

app.post(
  '/api/admin/users/:id/reset-password',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const temporaryPassword = crypto.randomBytes(9).toString('base64url');
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND is_admin = FALSE
       RETURNING id, email, full_name, is_admin`,
      [hashPassword(temporaryPassword), userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
    }

    return res.json({
      message: 'Password reset berhasil',
      temporaryPassword,
      user: mapUser(result.rows[0]),
    });
  })
);

app.get(
  '/api/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT approval_status FROM users WHERE id = $1 LIMIT 1', [req.auth.sub]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (result.rows[0].approval_status !== 'approved') {
      return res.status(403).json({ message: 'Account is waiting for admin approval' });
    }

    return res.json({ message: 'Dashboard access granted' });
  })
);

const TRANSPORTASI_UMUM = ['mobil', 'bus', 'kereta', 'pesawat'];
const TRANSPORTASI_PRIBADI = ['mobil', 'motor'];

function mapPerjalanan(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tujuanPerjalanan: row.tujuan_perjalanan,
    tempatPelaksanaan: row.tempat_pelaksanaan,
    tanggalBerangkat: row.tanggal_berangkat ? new Date(row.tanggal_berangkat).toISOString().split('T')[0] : null,
    tanggalKembali: row.tanggal_kembali ? new Date(row.tanggal_kembali).toISOString().split('T')[0] : null,
    jenisTransportasi: row.jenis_transportasi,
    detailTransportasi: row.detail_transportasi,
    gunakanKapalLaut: Boolean(row.gunakan_kapal_laut),
    kebutuhanBbm: Boolean(row.kebutuhan_bbm),
    kebutuhanBiayaTol: Boolean(row.kebutuhan_biaya_tol),
    kebutuhanParkir: Boolean(row.kebutuhan_parkir),
    kebutuhanLainnya: Boolean(row.kebutuhan_lainnya),
    tiketTransportasiUrl: row.tiket_transportasi_url,
    nominalBiayaTiket: row.nominal_biaya_tiket != null ? Number(row.nominal_biaya_tiket) : null,
    uangHarianTambahan: Boolean(row.uang_harian_tambahan),
    ketUangHarian: row.ket_uang_harian,
    transportTambahan: Boolean(row.transport_tambahan),
    ketTransportTambahan: row.ket_transport_tambahan,
    fotoPenginapanList: row.foto_penginapan || [],
    notaPenginapanList: row.nota_penginapan || [],
    nominalPenginapan: row.nominal_penginapan != null ? Number(row.nominal_penginapan) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePerjalananBody(body) {
  const errors = [];

  const tujuan = String(body.tujuanPerjalanan || body.tujuan_perjalanan || '').trim();
  const tempat = String(body.tempatPelaksanaan || body.tempat_pelaksanaan || '').trim();
  const tanggalBerangkat = String(body.tanggalBerangkat || body.tanggal_berangkat || '').trim();
  const tanggalKembali = String(body.tanggalKembali || body.tanggal_kembali || '').trim();
  const jenis = String(body.jenisTransportasi || body.jenis_transportasi || '').trim().toLowerCase();
  const detail = String(body.detailTransportasi || body.detail_transportasi || '').trim().toLowerCase();

  if (!tujuan) errors.push('Tujuan perjalanan is required');
  if (!tempat) errors.push('Tempat pelaksanaan is required');
  if (!tanggalBerangkat) errors.push('Tanggal berangkat is required');
  if (!tanggalKembali) errors.push('Tanggal kembali is required');

  if (!['umum', 'pribadi'].includes(jenis)) {
    errors.push('Jenis transportasi must be "umum" or "pribadi"');
  } else if (jenis === 'umum' && !TRANSPORTASI_UMUM.includes(detail)) {
    errors.push(`Detail transportasi for umum must be one of: ${TRANSPORTASI_UMUM.join(', ')}`);
  } else if (jenis === 'pribadi' && !TRANSPORTASI_PRIBADI.includes(detail)) {
    errors.push(`Detail transportasi for pribadi must be one of: ${TRANSPORTASI_PRIBADI.join(', ')}`);
  }

  return {
    errors,
    data: {
      tujuan,
      tempat,
      tanggalBerangkat,
      tanggalKembali,
      jenis,
      detail,
      gunakanKapalLaut: Boolean(body.gunakanKapalLaut ?? body.gunakan_kapal_laut ?? false),
      kebutuhanBbm: Boolean(body.kebutuhanBbm ?? body.kebutuhan_bbm ?? false),
      kebutuhanBiayaTol: Boolean(body.kebutuhanBiayaTol ?? body.kebutuhan_biaya_tol ?? false),
      kebutuhanParkir: Boolean(body.kebutuhanParkir ?? body.kebutuhan_parkir ?? false),
      kebutuhanLainnya: Boolean(body.kebutuhanLainnya ?? body.kebutuhan_lainnya ?? false),
      tiketTransportasiUrl: body.tiketTransportasiUrl || body.tiket_transportasi_url || null,
      nominalBiayaTiket: body.nominalBiayaTiket != null ? Number(body.nominalBiayaTiket)
        : body.nominal_biaya_tiket != null ? Number(body.nominal_biaya_tiket)
          : 0,
      uangHarianTambahan: Boolean(body.uangHarianTambahan ?? body.uang_harian_tambahan ?? false),
      ketUangHarian: String(body.ketUangHarian || body.ket_uang_harian || '').trim(),
      transportTambahan: Boolean(body.transportTambahan ?? body.transport_tambahan ?? false),
      ketTransportTambahan: String(body.ketTransportTambahan || body.ket_transport_tambahan || '').trim(),
      fotoPenginapanList: Array.isArray(body.fotoPenginapanList) ? body.fotoPenginapanList : (Array.isArray(body.foto_penginapan) ? body.foto_penginapan : []),
      notaPenginapanList: Array.isArray(body.notaPenginapanList) ? body.notaPenginapanList : (Array.isArray(body.nota_penginapan) ? body.nota_penginapan : []),
      nominalPenginapan: body.nominalPenginapan != null ? Number(body.nominalPenginapan)
        : body.nominal_penginapan != null ? Number(body.nominal_penginapan)
          : 0,
    },
  };
}

const PERJALANAN_COLUMNS = `id, user_id, tujuan_perjalanan, tempat_pelaksanaan,
       tanggal_berangkat, tanggal_kembali,
       jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
       kebutuhan_bbm, kebutuhan_biaya_tol, kebutuhan_parkir, kebutuhan_lainnya,
       tiket_transportasi_url, nominal_biaya_tiket,
       uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
       foto_penginapan, nota_penginapan, nominal_penginapan,
       created_at, updated_at`;

app.post(
  '/api/perjalanan-dinas',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { errors, data } = validatePerjalananBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    const result = await pool.query(
      `INSERT INTO perjalanan_dinas
         (user_id, tujuan_perjalanan, tempat_pelaksanaan, tanggal_berangkat, tanggal_kembali,
          jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
          kebutuhan_bbm, kebutuhan_biaya_tol, kebutuhan_parkir, kebutuhan_lainnya,
          tiket_transportasi_url, nominal_biaya_tiket,
          uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
          foto_penginapan, nota_penginapan, nominal_penginapan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING ${PERJALANAN_COLUMNS}`,
      [
        req.auth.sub,
        data.tujuan,
        data.tempat,
        data.tanggalBerangkat,
        data.tanggalKembali,
        data.jenis,
        data.detail,
        data.gunakanKapalLaut,
        data.kebutuhanBbm,
        data.kebutuhanBiayaTol,
        data.kebutuhanParkir,
        data.kebutuhanLainnya,
        data.tiketTransportasiUrl,
        data.nominalBiayaTiket,
        data.uangHarianTambahan,
        data.ketUangHarian,
        data.transportTambahan,
        data.ketTransportTambahan,
        JSON.stringify(data.fotoPenginapanList),
        JSON.stringify(data.notaPenginapanList),
        data.nominalPenginapan,
      ]
    );

    return res.status(201).json({
      message: 'Perjalanan dinas created',
      perjalanan: mapPerjalanan(result.rows[0]),
    });
  })
);

app.get(
  '/api/perjalanan-dinas',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT ${PERJALANAN_COLUMNS}
       FROM perjalanan_dinas
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.auth.sub]
    );

    return res.json({ perjalanan: result.rows.map(mapPerjalanan) });
  })
);

app.get(
  '/api/perjalanan-dinas/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid perjalanan id' });
    }

    const result = await pool.query(
      `SELECT ${PERJALANAN_COLUMNS}
       FROM perjalanan_dinas
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, req.auth.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Perjalanan dinas not found' });
    }

    return res.json({ perjalanan: mapPerjalanan(result.rows[0]) });
  })
);

app.put(
  '/api/perjalanan-dinas/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid perjalanan id' });
    }

    const { errors, data } = validatePerjalananBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') });
    }

    const result = await pool.query(
      `UPDATE perjalanan_dinas
       SET tujuan_perjalanan = $1,
           tempat_pelaksanaan = $2,
           tanggal_berangkat = $3,
           tanggal_kembali = $4,
           jenis_transportasi = $5,
           detail_transportasi = $6,
           gunakan_kapal_laut = $7,
           kebutuhan_bbm = $8,
           kebutuhan_biaya_tol = $9,
           kebutuhan_parkir = $10,
           kebutuhan_lainnya = $11,
           tiket_transportasi_url = $12,
           nominal_biaya_tiket = $13,
           uang_harian_tambahan = $14,
           ket_uang_harian = $15,
           transport_tambahan = $16,
           ket_transport_tambahan = $17,
           foto_penginapan = $18,
           nota_penginapan = $19,
           nominal_penginapan = $20,
           updated_at = NOW()
       WHERE id = $21 AND user_id = $22
       RETURNING ${PERJALANAN_COLUMNS}`,
      [
        data.tujuan,
        data.tempat,
        data.tanggalBerangkat,
        data.tanggalKembali,
        data.jenis,
        data.detail,
        data.gunakanKapalLaut,
        data.kebutuhanBbm,
        data.kebutuhanBiayaTol,
        data.kebutuhanParkir,
        data.kebutuhanLainnya,
        data.tiketTransportasiUrl,
        data.nominalBiayaTiket,
        data.uangHarianTambahan,
        data.ketUangHarian,
        data.transportTambahan,
        data.ketTransportTambahan,
        JSON.stringify(data.fotoPenginapanList),
        JSON.stringify(data.notaPenginapanList),
        data.nominalPenginapan,
        id,
        req.auth.sub,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Perjalanan dinas not found' });
    }

    return res.json({
      message: 'Perjalanan dinas updated',
      perjalanan: mapPerjalanan(result.rows[0]),
    });
  })
);

app.delete(
  '/api/perjalanan-dinas/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid perjalanan id' });
    }

    const result = await pool.query(
      'DELETE FROM perjalanan_dinas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.auth.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Perjalanan dinas not found' });
    }

    return res.json({ message: 'Perjalanan dinas deleted' });
  })
);

app.get(
  '/api/admin/perjalanan-dinas',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT pd.id, pd.user_id, u.full_name, u.nip, u.jabatan,
              pd.tujuan_perjalanan, pd.tempat_pelaksanaan, pd.tanggal_berangkat, pd.tanggal_kembali,
              pd.jenis_transportasi, pd.detail_transportasi, pd.gunakan_kapal_laut,
              pd.kebutuhan_bbm, pd.kebutuhan_biaya_tol, pd.kebutuhan_parkir, pd.kebutuhan_lainnya,
              pd.tiket_transportasi_url, pd.nominal_biaya_tiket,
              pd.uang_harian_tambahan, pd.ket_uang_harian, pd.transport_tambahan, pd.ket_transport_tambahan,
              pd.foto_penginapan, pd.nota_penginapan, pd.nominal_penginapan,
              pd.created_at, pd.updated_at
       FROM perjalanan_dinas pd
       JOIN users u ON u.id = pd.user_id
       ORDER BY pd.created_at DESC`
    );

    return res.json({
      perjalanan: result.rows.map((row) => ({
        ...mapPerjalanan(row),
        fullName: row.full_name,
        nip: row.nip,
        jabatan: row.jabatan,
      })),
    });
  })
);

app.get(
  '/api/admin/event',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT er.id, er.user_id, u.full_name, u.nip, u.jabatan,
              er.foto_kedatangan, er.foto_acara,
              er.uang_harian_tambahan, er.ket_uang_harian, er.transport_tambahan, er.ket_transport_tambahan,
              er.nota_biaya_tambahan, er.nominal_biaya_tambahan, er.created_at, er.updated_at
       FROM event_reports er
       JOIN users u ON u.id = er.user_id
       ORDER BY er.created_at DESC`
    );

    return res.json({
      events: result.rows.map((row) => ({
        ...mapEventReport(row),
        fullName: row.full_name,
        nip: row.nip,
        jabatan: row.jabatan,
      })),
    });
  })
);

app.get(
  '/api/admin/post-event',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT pe.id, pe.user_id, u.full_name, u.nip, u.jabatan,
              pe.foto_checkout_hotel, pe.jenis_transportasi, pe.detail_transportasi, pe.gunakan_kapal_laut,
              pe.tiket_transportasi, pe.nominal_biaya_tiket, pe.uang_harian_tambahan, pe.ket_uang_harian, 
              pe.transport_tambahan, pe.ket_transport_tambahan,
              pe.nota_biaya_tambahan, pe.nominal_biaya_tambahan, pe.foto_saat_kembali, pe.created_at, pe.updated_at
       FROM post_event_reports pe
       JOIN users u ON u.id = pe.user_id
       ORDER BY pe.created_at DESC`
    );

    return res.json({
      postEvents: result.rows.map((row) => ({
        ...mapPostEventReport(row),
        fullName: row.full_name,
        nip: row.nip,
        jabatan: row.jabatan,
      })),
    });
  })
);

// --- ADMIN USER MANAGEMENT ---

app.get(
  '/api/admin/employees',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT id, email, full_name, nip, jabatan, pangkat_golongan 
       FROM users 
       WHERE is_admin = false AND approval_status = 'approved'
       ORDER BY full_name ASC`
    );
    return res.json(result.rows);
  })
);

app.get(
  '/api/admin/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    let query = `SELECT id, email, full_name, nip, jabatan, pangkat_golongan, is_admin, onboarding_status, approval_status, created_at FROM users`;
    const params = [];
    if (status) {
      query += ` WHERE approval_status = $1`;
      params.push(status);
    }
    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    
    // Map to camelCase for frontend
    const users = result.rows.map(r => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      nip: r.nip,
      jabatan: r.jabatan,
      pangkatGolongan: r.pangkat_golongan,
      isAdmin: r.is_admin,
      onboardingStatus: r.onboarding_status,
      approvalStatus: r.approval_status,
      createdAt: r.created_at
    }));
    return res.json({ users });
  })
);

app.post(
  '/api/admin/users/:id/approve',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await pool.query(
      `UPDATE users 
       SET approval_status = 'approved', onboarding_status = 'approved', approved_at = NOW(), approved_by = $1 
       WHERE id = $2 RETURNING id`,
      [req.auth.sub, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User approved' });
  })
);

app.post(
  '/api/admin/users/:id/reject',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const result = await pool.query(
      `UPDATE users 
       SET approval_status = 'rejected', onboarding_status = 'registered' 
       WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User rejected' });
  })
);

app.post(
  '/api/admin/users/:id/reset-password',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    // Reset to 'integra123'
    const newPasswordHash = hashPassword('integra123');
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id`,
      [newPasswordHash, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Password reset to integra123' });
  })
);

app.post(
  '/api/upload/tiket',
  requireAuth,
  (req, res, next) => {
    uploadTiket.single('tiket')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File terlalu besar (maks 10 MB)' });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided. Field name must be "tiket".' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/tiket/${req.file.filename}`;

    return res.status(201).json({
      message: 'Tiket uploaded successfully',
      tiketUrl: fileUrl,
      filename: req.file.filename,
    });
  }
);

app.post(
  '/api/upload/base64',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: 'No base64 image provided' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid base64 string' });
    }

    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    let ext = '.jpg';
    if (type.includes('png')) ext = '.png';
    else if (type.includes('webp')) ext = '.webp';

    const eventDir = path.join(UPLOADS_DIR, 'event');
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }

    const filename = `event_${req.auth.sub}_${Date.now()}${ext}`;
    const filePath = path.join(eventDir, filename);

    fs.writeFileSync(filePath, data);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/tiket/event/${filename}`;

    return res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: fileUrl,
      filename,
    });
  })
);

const EVENT_COLUMNS = `id, user_id, foto_kedatangan, foto_acara,
       uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
       nota_biaya_tambahan, nominal_biaya_tambahan, created_at, updated_at`;

function mapEventReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fotoKedatangan: row.foto_kedatangan || [],
    fotoAcara: row.foto_acara || [],
    uangHarianTambahan: Boolean(row.uang_harian_tambahan),
    ketUangHarian: row.ket_uang_harian,
    transportTambahan: Boolean(row.transport_tambahan),
    ketTransportTambahan: row.ket_transport_tambahan,
    notaBiayaTambahan: row.nota_biaya_tambahan || [],
    nominalBiayaTambahan: row.nominal_biaya_tambahan != null ? Number(row.nominal_biaya_tambahan) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.post(
  '/api/event',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = req.body;
    const result = await pool.query(
      `INSERT INTO event_reports
         (user_id, foto_kedatangan, foto_acara,
          uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
          nota_biaya_tambahan, nominal_biaya_tambahan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING ${EVENT_COLUMNS}`,
      [
        req.auth.sub,
        JSON.stringify(data.fotoKedatangan || []),
        JSON.stringify(data.fotoAcara || []),
        Boolean(data.uangHarianTambahan),
        String(data.ketUangHarian || '').trim(),
        Boolean(data.transportTambahan),
        String(data.ketTransportTambahan || '').trim(),
        JSON.stringify(data.notaBiayaTambahan || []),
        data.nominalBiayaTambahan != null ? Number(data.nominalBiayaTambahan) : 0,
      ]
    );

    return res.status(201).json({
      message: 'Event report created',
      event: mapEventReport(result.rows[0]),
    });
  })
);

app.get(
  '/api/event',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT ${EVENT_COLUMNS}
       FROM event_reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.auth.sub]
    );

    return res.json({ events: result.rows.map(mapEventReport) });
  })
);

// ===================== POST EVENT =====================

const POST_EVENT_COLUMNS = `id, user_id, foto_checkout_hotel, jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
       tiket_transportasi, nominal_biaya_tiket, uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
       nota_biaya_tambahan, nominal_biaya_tambahan, foto_saat_kembali, created_at, updated_at`;

function mapPostEventReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fotoCheckoutHotel: row.foto_checkout_hotel || [],
    jenisTransportasi: row.jenis_transportasi,
    detailTransportasi: row.detail_transportasi,
    gunakanKapalLaut: row.gunakan_kapal_laut,
    tiketTransportasi: row.tiket_transportasi || [],
    nominalBiayaTiket: row.nominal_biaya_tiket != null ? Number(row.nominal_biaya_tiket) : 0,
    uangHarianTambahan: Boolean(row.uang_harian_tambahan),
    ketUangHarian: row.ket_uang_harian,
    transportTambahan: Boolean(row.transport_tambahan),
    ketTransportTambahan: row.ket_transport_tambahan,
    notaBiayaTambahan: row.nota_biaya_tambahan || [],
    nominalBiayaTambahan: row.nominal_biaya_tambahan != null ? Number(row.nominal_biaya_tambahan) : 0,
    fotoSaatKembali: row.foto_saat_kembali || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.post(
  '/api/post-event',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = req.body;
    const result = await pool.query(
      `INSERT INTO post_event_reports
         (user_id, foto_checkout_hotel, jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
          tiket_transportasi, nominal_biaya_tiket,
          uang_harian_tambahan, ket_uang_harian, transport_tambahan, ket_transport_tambahan,
          nota_biaya_tambahan, nominal_biaya_tambahan, foto_saat_kembali)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${POST_EVENT_COLUMNS}`,
      [
        req.auth.sub,
        JSON.stringify(data.fotoCheckoutHotel || []),
        String(data.jenisTransportasi || '').trim(),
        String(data.detailTransportasi || '').trim(),
        Boolean(data.gunakanKapalLaut),
        JSON.stringify(data.tiketTransportasi || []),
        data.nominalBiayaTiket != null ? Number(data.nominalBiayaTiket) : 0,
        Boolean(data.uangHarianTambahan),
        String(data.ketUangHarian || '').trim(),
        Boolean(data.transportTambahan),
        String(data.ketTransportTambahan || '').trim(),
        JSON.stringify(data.notaBiayaTambahan || []),
        data.nominalBiayaTambahan != null ? Number(data.nominalBiayaTambahan) : 0,
        JSON.stringify(data.fotoSaatKembali || []),
      ]
    );

    return res.status(201).json({
      message: 'Post-Event report created',
      postEvent: mapPostEventReport(result.rows[0]),
    });
  })
);

app.get(
  '/api/post-event',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT ${POST_EVENT_COLUMNS}
       FROM post_event_reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.auth.sub]
    );

    return res.json({ postEvents: result.rows.map(mapPostEventReport) });
  })
);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});