const { Pool } = require('pg');
require('dotenv').config();
const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const digest = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$sha512$${iterations}$${salt}$${digest}`;
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'integra_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function createAdmin() {
  try {
    const hashed = hashPassword('admin123');
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, is_admin, onboarding_status, approval_status, nip, jabatan, pangkat_golongan)
       VALUES ($1, $2, $3, true, 'approved', 'approved', '198001012005011001', 'Administrator', 'IV/a')
       ON CONFLICT (email) DO UPDATE 
       SET is_admin = true, approval_status = 'approved', onboarding_status = 'approved', password_hash = $2`,
      ['admin@integra.com', hashed, 'Super Admin']
    );
    console.log('Admin account created successfully:');
    console.log('Email: admin@integra.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    pool.end();
  }
}

createAdmin();
