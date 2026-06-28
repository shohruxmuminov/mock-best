import pg from 'pg';
import config from './config.js';

const { Pool } = pg;

if (!config.databaseUrl) {
  console.warn('[db] DATABASE_URL is not set — database features will be unavailable until it is configured.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl);

const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 12000,
  idleTimeoutMillis: 10000,
});

// CRITICAL on serverless: without this listener an idle-client error (which
// happens routinely when the platform drops a connection) becomes an uncaught
// exception that crashes the whole function (FUNCTION_INVOCATION_FAILED).
pool.on('error', (err) => {
  console.error('[pg pool error]', err.message);
});

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS files (
    id          SERIAL PRIMARY KEY,
    mime        TEXT,
    name        TEXT,
    data        BYTEA NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS candidates (
    id          SERIAL PRIMARY KEY,
    full_name   TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,
    banned      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS mock_tests (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    test_name       TEXT NOT NULL,
    listening_html  TEXT,
    listening_audio TEXT,
    reading_html    TEXT,
    writing_html    TEXT,
    order_index     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS answer_sheets (
    id            SERIAL PRIMARY KEY,
    candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    mock_test_id  INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    section       TEXT NOT NULL,
    answers       JSONB NOT NULL,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, mock_test_id, section)
  )`,
  `CREATE TABLE IF NOT EXISTS writing_uploads (
    id            SERIAL PRIMARY KEY,
    candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    mock_test_id  INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    file_url      TEXT NOT NULL,
    original_name TEXT,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS monitoring_events (
    id            SERIAL PRIMARY KEY,
    candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    section       TEXT,
    detail        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS presence (
    candidate_id  INTEGER PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
    full_name     TEXT NOT NULL,
    code          TEXT NOT NULL,
    section       TEXT,
    last_seen     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS signals (
    id            SERIAL PRIMARY KEY,
    candidate_id  INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    delivered     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(code)`,
  `CREATE INDEX IF NOT EXISTS idx_mock_tests_order ON mock_tests(order_index, id)`,
];

// Ensure the schema exists. Cached so it runs once per warm instance.
let schemaPromise = null;
export function ensureSchema() {
  if (!config.databaseUrl) {
    return Promise.reject(new Error('Database is not configured (DATABASE_URL missing).'));
  }
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const stmt of SCHEMA) await pool.query(stmt);
    })().catch((err) => {
      schemaPromise = null; // allow retry on a later request
      throw err;
    });
  }
  return schemaPromise;
}

// All data access goes through here; the schema is ensured lazily so that
// DB-free routes (admin code login, health, config) never touch the database.
export async function query(text, params) {
  await ensureSchema();
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export default pool;
