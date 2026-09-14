// All database access for the app lives in this one file. Every function
// here runs a plain SQL query against Postgres using Neon's serverless
// driver (`@neondatabase/serverless`) and its `sql` tagged template — the
// ${value} placeholders are automatically sent as separate query
// parameters (not glued into the SQL string), which is what keeps this
// safe from SQL-injection without needing an ORM. Vercel's own Postgres
// storage is powered by Neon under the hood (see README.md), so this is
// the package Vercel itself points to today. Every query below resolves
// straight to an array of row objects (no `.rows` wrapper).
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ---- Folders ----------------------------------------------------------

// Top-level folders (parentId omitted/null) or the direct children of one
// folder (pass its id).
export async function getFolders(parentId = null) {
  if (parentId === null) {
    return sql`SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name`;
  }
  return sql`SELECT * FROM folders WHERE parent_id = ${parentId} ORDER BY name`;
}

// Every folder in the archive, flat. Used to build breadcrumbs and the
// folder picker in "move to folder" / quick-add, where we need the whole
// tree rather than just one level.
export async function getAllFolders() {
  return sql`SELECT * FROM folders ORDER BY name`;
}

export async function getFolder(id) {
  const rows = await sql`SELECT * FROM folders WHERE id = ${id}`;
  return rows[0] || null;
}

export async function createFolder(name, parentId = null) {
  const rows = await sql`
    INSERT INTO folders (name, parent_id)
    VALUES (${name}, ${parentId})
    RETURNING *`;
  return rows[0];
}

export async function renameFolder(id, name) {
  const rows = await sql`
    UPDATE folders SET name = ${name}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`;
  return rows[0];
}

export async function moveFolder(id, parentId) {
  const rows = await sql`
    UPDATE folders SET parent_id = ${parentId}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`;
  return rows[0];
}

// Deleting a folder also deletes every subfolder and item inside it — see
// the "ON DELETE CASCADE" in the table definitions (scripts/init-db.js).
export async function deleteFolder(id) {
  await sql`DELETE FROM folders WHERE id = ${id}`;
}

// ---- Items (links / photos / notes) -----------------------------------

export async function getItems(folderId) {
  return sql`SELECT * FROM items WHERE folder_id = ${folderId} ORDER BY created_at DESC`;
}

export async function getItem(id) {
  const rows = await sql`SELECT * FROM items WHERE id = ${id}`;
  return rows[0] || null;
}

// `data` can include: folderId, type, title, url, faviconUrl, description
// (links), imageUrl (photos), content (notes). Any field not relevant to
// the item's type is simply left null.
export async function createItem(data) {
  const {
    folderId,
    type,
    title = null,
    url = null,
    faviconUrl = null,
    description = null,
    imageUrl = null,
    content = null,
  } = data;

  const rows = await sql`
    INSERT INTO items
      (folder_id, type, title, url, favicon_url, description, image_url, content)
    VALUES
      (${folderId}, ${type}, ${title}, ${url}, ${faviconUrl}, ${description}, ${imageUrl}, ${content})
    RETURNING *`;
  return rows[0];
}

export async function updateItemTitle(id, title) {
  const rows = await sql`
    UPDATE items SET title = ${title}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`;
  return rows[0];
}

export async function updateNoteContent(id, content) {
  const rows = await sql`
    UPDATE items SET content = ${content}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`;
  return rows[0];
}

export async function moveItem(id, folderId) {
  const rows = await sql`
    UPDATE items SET folder_id = ${folderId}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`;
  return rows[0];
}

export async function deleteItem(id) {
  await sql`DELETE FROM items WHERE id = ${id}`;
}

// Searches title, note text, and URL in one go. ILIKE is Postgres's
// case-insensitive "contains" match — good enough for a personal archive
// at this scale without needing a dedicated search engine.
export async function searchItems(query) {
  const pattern = `%${query}%`;
  return sql`
    SELECT * FROM items
    WHERE title ILIKE ${pattern} OR content ILIKE ${pattern} OR url ILIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT 50`;
}
