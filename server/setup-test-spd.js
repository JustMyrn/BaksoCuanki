/**
 * Script setup: approve user test@test.com dan buat SPD sample
 * Jalankan: cd server && node setup-test-spd.js
 */
require('dotenv').config();
const pool = require('./db');

async function setup() {
  try {
    // 1. Cari user test@test.com
    const userResult = await pool.query(
      'SELECT id, email, approval_status, onboarding_status FROM users WHERE email = $1 LIMIT 1',
      ['test@test.com']
    );

    if (userResult.rowCount === 0) {
      console.error('❌ User test@test.com tidak ditemukan.');
      process.exit(0);
    }

    const user = userResult.rows[0];
    console.log(`✅ User ditemukan: ID=${user.id} | status=${user.approval_status}`);

    // 2. Approve user
    await pool.query(
      `UPDATE users
       SET approval_status = 'approved',
           onboarding_status = 'approved',
           approved_at = NOW(),
           approved_by = $1,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );
    console.log('✅ User approved!');

    // 3. Cek apakah sudah ada SPD untuk user ini
    const spdResult = await pool.query(
      'SELECT id FROM perjalanan_dinas WHERE user_id = $1 LIMIT 1',
      [user.id]
    );

    if (spdResult.rowCount > 0) {
      console.log(`⚠️ SPD sudah ada (ID: ${spdResult.rows[0].id}), skip insert.`);
    } else {
      // 4. Buat SPD sample
      const insertResult = await pool.query(
        `INSERT INTO perjalanan_dinas
         (user_id, tujuan_perjalanan, tempat_pelaksanaan,
          jenis_transportasi, detail_transportasi, gunakan_kapal_laut,
          kebutuhan_bbm, kebutuhan_biaya_tol, kebutuhan_parkir, kebutuhan_lainnya,
          tiket_transportasi_url, nominal_biaya_tiket)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          user.id,
          'Rapat Koordinasi Cabang',
          'Surabaya',
          'pribadi',
          'mobil',
          false,
          true,
          true,
          true,
          false,
          '',
          0,
        ]
      );
      console.log(`✅ SPD sample dibuat! (SPD ID: ${insertResult.rows[0].id})`);
    }

    console.log('\n🎉 Setup selesai! test@test.com sekarang bisa login dan lihat SPD.');
    console.log('   Password: (password yang didaftarkan user)');
    console.log('   Login → Dashboard → Ada SPD → Next → Alur Pengisian');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setup();