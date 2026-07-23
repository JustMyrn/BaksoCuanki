const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Cek apakah koneksi berhasil
pool.connect((err) => {
  if (err) {
    console.error('Koneksi ke database gagal:', err.stack);
  } else {
    console.log('Berhasil terhubung ke database PostgreSQL');
  }
});

module.exports = pool;