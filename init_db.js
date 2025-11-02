// init_db.js — one-time setup script for PostgreSQL
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        tracking TEXT UNIQUE,
        sender TEXT,
        receiver TEXT,
        status TEXT,
        security_level TEXT,
        last_updated TIMESTAMP
      );
    `);
    console.log("✅ Shipments table created or already exists.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  } finally {
    process.exit();
  }
})();