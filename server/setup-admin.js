/**
 * Script setup: buat akun admin dengan username & password.
 * Jalankan: cd server && node setup-admin.js
 */
require('dotenv').config();
const crypto = require('crypto');
const pool = require('./db');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const digest = crypto
    .pbkdf2Sync(password, salt, iterations, 64, 'sha512')
    .toString('hex');
  return `pbkdf2$sha512$${iterations}$${salt}$${digest}`;
}

async function setup() {
  try {
    // 1. Pastikan kolom username ada (self-migration)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'username'
        ) THEN
          ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
          RAISE NOTICE 'Column username added.';
        END IF;
      END
      $$;
    `);
    console.log('✅ Kolom username OK');

    // 2. Cek apakah admin sudah ada
    const check = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1",
      ['admin', 'admin@integra.id']
    );

    if (check.rowCount > 0) {
      // Update jadi admin + approved
      await pool.query(
        `UPDATE users
         SET username = 'admin',
             is_admin = TRUE,
             approval_status = 'approved',
             onboarding_status = 'approved',
             password_hash = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [hashPassword('adminkemenham@2026'), check.rows[0].id]
      );
      console.log(`✅ Admin diupdate! (ID: ${check.rows[0].id})`);
    } else {
      // Buat baru
      const insert = await pool.query(
        `INSERT INTO users
         (email, username, password_hash, full_name, is_admin, onboarding_status, approval_status)
         VALUES ($1, $2, $3, $4, TRUE, 'approved', 'approved')
         RETURNING id`,
        ['admin@integra.id', 'admin', hashPassword('adminkemenham@2026'), 'Administrator']
      );
      console.log(`✅ Admin dibuat! (ID: ${insert.rows[0].id})`);
    }

    console.log('\n🎉 Setup selesai!');
    console.log('   Username: Admin');
    console.log('   Password: adminkemenham@2026');
    console.log('   URL:     http://localhost:5173/#/admin');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setup();