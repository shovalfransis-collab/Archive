-- The starting schema: everything scripts/init-db.js used to create.
-- Every statement uses IF NOT EXISTS, so this is safe to run against a
-- database that was already set up the old way (it just does nothing).

CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Columns added after the first release.
ALTER TABLE items ADD COLUMN IF NOT EXISTS note TEXT;      -- annotation on any item
ALTER TABLE folders ADD COLUMN IF NOT EXISTS icon TEXT;    -- custom folder emoji
ALTER TABLE items ADD COLUMN IF NOT EXISTS summary TEXT;   -- AI one-line summary
ALTER TABLE items ADD COLUMN IF NOT EXISTS tags TEXT[];    -- AI tags

CREATE INDEX IF NOT EXISTS items_folder_id_idx ON items(folder_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
