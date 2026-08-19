const pool = require('./db');

async function migrate() {
  try {
    console.log('Adding penginapan columns to perjalanan_dinas...');
    await pool.query(`
      ALTER TABLE perjalanan_dinas 
      ADD COLUMN IF NOT EXISTS foto_penginapan JSONB,
      ADD COLUMN IF NOT EXISTS nota_penginapan JSONB,
      ADD COLUMN IF NOT EXISTS nominal_penginapan NUMERIC(15, 2) DEFAULT 0;
    `);
    console.log('Columns added to perjalanan_dinas.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
