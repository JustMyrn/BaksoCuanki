/**
 * Isi data profil test@test.com
 * Jalankan: cd server && node fill-test-profile.js
 */
require('dotenv').config();
const pool = require('./db');

async function fill() {
  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = 'Test User',
           nip = '199001012022011001',
           jabatan = 'Staff Administrasi',
           pangkat_golongan = 'III B',
           profile_completed_at = NOW(),
           updated_at = NOW()
       WHERE email = 'test@test.com'
       RETURNING id, email, full_name, nip, jabatan, pangkat_golongan`
    );

    if (result.rowCount === 0) {
      console.error('❌ User test@test.com tidak ditemukan');
    } else {
      const user = result.rows[0];
      console.log('✅ Profil test@test.com diisi:');
      console.log(`   Nama: ${user.full_name}`);
      console.log(`   NIP: ${user.nip}`);
      console.log(`   Jabatan: ${user.jabatan}`);
      console.log(`   Pangkat/Gol: ${user.pangkat_golongan}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fill();