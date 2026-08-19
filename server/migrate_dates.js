const pool = require('./db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE perjalanan_dinas ADD COLUMN IF NOT EXISTS tanggal_berangkat DATE;');
    await pool.query('ALTER TABLE perjalanan_dinas ADD COLUMN IF NOT EXISTS tanggal_kembali DATE;');
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    pool.end();
  }
}

migrate();
