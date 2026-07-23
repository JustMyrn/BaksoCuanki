const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

app.use(cors());
app.use(express.json());

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
    { expiresIn: '7d' }
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
       RETURNING id, email, full_name, nip, is_admin, onboarding_status, approval_status, last_login_at,
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
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Email is invalid' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, nip, is_admin, onboarding_status, approval_status,
              last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
       RETURNING id, email, full_name, nip, is_admin, onboarding_status, approval_status,
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
      `SELECT id, email, full_name, nip, is_admin, onboarding_status, approval_status,
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
           onboarding_status = 'pending_approval',
           approval_status = 'pending',
           updated_at = NOW(),
           profile_completed_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, nip, is_admin, onboarding_status, approval_status,
                 last_login_at, profile_completed_at, approved_at, approved_by, created_at, updated_at`,
      [fullName, nip, req.auth.sub]
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
       RETURNING id, email, full_name, nip, is_admin, onboarding_status, approval_status,
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
      `SELECT id, email, full_name, nip, is_admin, onboarding_status, approval_status,
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

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});