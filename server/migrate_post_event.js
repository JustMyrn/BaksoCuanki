const pool = require('./db');

async function migrate() {
  try {
    console.log('Creating post_event_reports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_event_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        foto_checkout_hotel JSONB,
        jenis_transportasi TEXT,
        detail_transportasi TEXT,
        tiket_transportasi JSONB,
        nominal_biaya_tiket NUMERIC(15, 2) DEFAULT 0,
        uang_harian_tambahan BOOLEAN DEFAULT false,
        ket_uang_harian TEXT,
        transport_tambahan BOOLEAN DEFAULT false,
        ket_transport_tambahan TEXT,
        nota_biaya_tambahan JSONB,
        nominal_biaya_tambahan NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS post_event_reports_user_id_idx ON post_event_reports (user_id);
    `);
    console.log('Table post_event_reports created.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
