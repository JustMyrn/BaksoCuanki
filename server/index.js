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
app.use(express.json());

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

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Anti-fraud: server time endpoint (tidak bisa dipalsukan oleh user)
app.get('/api/time', (req, res) => {
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
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
       WHERE email = $1 OR lower(username) = $1
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
    jenisTransportasi: row.jenis_transportasi,
    detailTransportasi: row.detail_transportasi,
    gunakanKapalLaut: Boolean(row.gunakan_kapal_laut),
    kebutuhanBbm: Boolean(row.kebutuhan_bbm),
    kebutuhanBiayaTol: Boolean(row.kebutuhan_biaya_tol),
    kebutuhanParkir: Boolean(row.kebutuhan_parkir),
    kebutuhanLainnya: Boolean(row.kebutuhan_lainnya),
    tiketTransportasiUrl: row.tiket_transportasi_url,
    nominalBiayaTiket: row.nominal_biaya_tiket != null ? Number(row.nominal_biaya_tiket) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePerjalananBody(body) {
  const errors = [];

  const tujuan = String(body.tujuanPerjalanan || body.tujuan_perjalanan || '').trim();
  const tempat = String(body.tempatPelaksanaan || body.tempat_pelaksanaan || '').trim();
  const jenis = String(body.jenisTransportasi || body.jenis_transportasi || '').trim().toLowerCase();
  const detail = String(body.detailTransportasi || body.detail_transportasi || '').trim().toLowerCase();

  if (!tujuan) errors.push('Tujuan perjalanan is required');
  if (!tempat) errors.push('Tempat pelaksanaan is required');

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
    },
  };
}

const PERJALANAN_COLUMNS = `id, user_id, tujuan_perjalanan, tempat_pelaksanaan,
       jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
       kebutuhan_bbm, kebutuhan_biaya_tol, kebutuhan_parkir, kebutuhan_lainnya,
       tiket_transportasi_url, nominal_biaya_tiket, created_at, updated_at`;

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
         (user_id, tujuan_perjalanan, tempat_pelaksanaan,
          jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
          kebutuhan_bbm, kebutuhan_biaya_tol, kebutuhan_parkir, kebutuhan_lainnya,
          tiket_transportasi_url, nominal_biaya_tiket)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${PERJALANAN_COLUMNS}`,
      [
        req.auth.sub,
        data.tujuan,
        data.tempat,
        data.jenis,
        data.detail,
        data.gunakanKapalLaut,
        data.kebutuhanBbm,
        data.kebutuhanBiayaTol,
        data.kebutuhanParkir,
        data.kebutuhanLainnya,
        data.tiketTransportasiUrl,
        data.nominalBiayaTiket,
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
           jenis_transportasi = $3,
           detail_transportasi = $4,
           gunakan_kapal_laut = $5,
           kebutuhan_bbm = $6,
           kebutuhan_biaya_tol = $7,
           kebutuhan_parkir = $8,
           kebutuhan_lainnya = $9,
           tiket_transportasi_url = $10,
           nominal_biaya_tiket = $11,
           updated_at = NOW()
       WHERE id = $12 AND user_id = $13
       RETURNING ${PERJALANAN_COLUMNS}`,
      [
        data.tujuan,
        data.tempat,
        data.jenis,
        data.detail,
        data.gunakanKapalLaut,
        data.kebutuhanBbm,
        data.kebutuhanBiayaTol,
        data.kebutuhanParkir,
        data.kebutuhanLainnya,
        data.tiketTransportasiUrl,
        data.nominalBiayaTiket,
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
              pd.tujuan_perjalanan, pd.tempat_pelaksanaan,
              pd.jenis_transportasi, pd.detail_transportasi, pd.gunakan_kapal_laut,
              pd.kebutuhan_bbm, pd.kebutuhan_biaya_tol, pd.kebutuhan_parkir, pd.kebutuhan_lainnya,
              pd.tiket_transportasi_url, pd.nominal_biaya_tiket,
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

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});