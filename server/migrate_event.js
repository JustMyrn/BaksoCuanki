const pool = require('./db');

async function migrate() {
  try {
    console.log('Adding columns to perjalanan_dinas...');
    await pool.query(`
      ALTER TABLE perjalanan_dinas 
      ADD COLUMN IF NOT EXISTS uang_harian_tambahan BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ket_uang_harian TEXT,
      ADD COLUMN IF NOT EXISTS transport_tambahan BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS ket_transport_tambahan TEXT;
    `);
    console.log('Columns added to perjalanan_dinas.');

    console.log('Creating event_reports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        foto_kedatangan JSONB,
        foto_acara JSONB,
        uang_harian_tambahan BOOLEAN DEFAULT false,
        ket_uang_harian TEXT,
        transport_tambahan BOOLEAN DEFAULT false,
        ket_transport_tambahan TEXT,
        nota_biaya_tambahan JSONB,
        nominal_biaya_tambahan NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table event_reports created.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
