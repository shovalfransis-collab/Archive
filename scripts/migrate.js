// Brings the database schema up to date by running every file in
// migrations/ that hasn't been run yet, in filename order
// (001_..., 002_..., ...).
//
//   npm run migrate            run anything new
//   npm run migrate -- --status  only list what's applied / pending
//
// Which files already ran is recorded in a `schema_migrations` table, so
// running this again is always safe — it only does the new ones. Each file
// runs inside a transaction: if any statement in it fails, none of that
// file's changes are kept and the script stops.
//
// To change the schema later: add a new file with the next number (e.g.
// migrations/003_add_something.sql) and run `npm run migrate`. Never edit a
// file that has already run on your real database — add a new one instead.
//
// It uses the same DATABASE_URL as the app (see README.md:
// `vercel env pull .env.local`). Vercel does NOT run this for you on deploy.
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

function listMigrationFiles(dir = MIGRATIONS_DIR) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
}

// `client` is anything with an async query(text, params?) that returns
// { rows } — a Neon/pg client in real use, or a stand-in in tests. Kept
// separate from main() so the logic can be tested without a real database.
async function runMigrations(client, { dir = MIGRATIONS_DIR, log = console.log } = {}) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));
  const pending = listMigrationFiles(dir).filter((f) => !done.has(f));

  if (pending.length === 0) {
    log('Database is already up to date.');
    return [];
  }

  for (const file of pending) {
    log(`Running ${file}...`);
    const sqlText = fs.readFileSync(path.join(dir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sqlText);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`${file} failed, nothing from it was applied: ${err.message}`);
    }
  }
  log(`Done! Ran ${pending.length} migration(s).`);
  return pending;
}

// Read-only: reports what has and hasn't run, without creating anything.
async function showStatus(client, { dir = MIGRATIONS_DIR, log = console.log } = {}) {
  const exists = await client.query(
    "SELECT to_regclass('public.schema_migrations') IS NOT NULL AS ok"
  );
  const done = new Set();
  if (exists.rows[0].ok) {
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    rows.forEach((r) => done.add(r.name));
  }
  for (const file of listMigrationFiles(dir)) {
    log(`${done.has(file) ? '[x] applied' : '[ ] pending'}  ${file}`);
  }
}

async function main() {
  require('dotenv').config({ path: '.env.local' });
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — run `npx vercel env pull .env.local` first.');
    process.exit(1);
  }

  // A WebSocket Pool (not the one-shot HTTP `neon()` helper the app uses)
  // because migrations need a real session: BEGIN/COMMIT transactions and
  // several statements per file.
  const { Pool } = require('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    if (process.argv.includes('--status')) {
      await showStatus(client);
    } else {
      await runMigrations(client);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Something went wrong:', err.message);
    process.exit(1);
  });
}

module.exports = { runMigrations, showStatus, listMigrationFiles };
