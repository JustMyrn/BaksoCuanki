const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  try {
    await pool.query(`ALTER TABLE post_event_reports ADD COLUMN IF NOT EXISTS gunakan_kapal_laut BOOLEAN DEFAULT false;`);
    console.log('Migration successful: added gunakan_kapal_laut to post_event_reports');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
