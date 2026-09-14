// Run this once to create the `folders` and `items` tables in your Neon
// Postgres database (provisioned through Vercel's Storage tab):
//
//   node scripts/init-db.js
//
// It reads the same DATABASE_URL environment variable your deployed app
// uses — see README.md for how to get it onto your computer first (short
// version: `vercel env pull .env.local`).
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Creating tables (if they do not already exist)...');

  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('link', 'photo', 'note')),
      title TEXT,
      url TEXT,
      favicon_url TEXT,
      description TEXT,
      image_url TEXT,
      content TEXT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  // Added after the initial release — a free-text annotation you can attach
  // to any item (link, photo, or note) regardless of its main content, e.g.
  // "watch this before the meeting". IF NOT EXISTS keeps this script safe
  // to re-run against a database that already has the column.
  await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS note TEXT;`;

  await sql`CREATE INDEX IF NOT EXISTS items_folder_id_idx ON items(folder_id);`;
  await sql`CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);`;

  console.log('Done! Your database is ready.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Something went wrong:', err);
  process.exit(1);
});
