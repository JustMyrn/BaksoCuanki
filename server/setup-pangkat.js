/**
 * Setup: tambah kolom pangkat_golongan ke tabel users
 * Jalankan: cd server && node setup-pangkat.js
 */
require('dotenv').config();
const pool = require('./db');

async function setup() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pangkat_golongan TEXT');
    console.log('✅ Kolom pangkat_golongan berhasil ditambahkan (jika belum ada)');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setup();