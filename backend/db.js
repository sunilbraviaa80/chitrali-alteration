// backend/db.js
import pg from 'pg';
const { Pool } = pg;

// Render will provide DATABASE_URL in env vars
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // needed for Render PostgreSQL
});

export async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}
