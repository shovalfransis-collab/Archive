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

export async function createFolder(name, parentId = null, icon = null) {
  const rows = await sql`
    INSERT INTO folders (name, parent_id, icon)
    VALUES (${name}, ${parentId}, ${icon})
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

export async function updateFolderIcon(id, icon) {
  const rows = await sql`
    UPDATE folders SET icon = ${icon}, updated_at = now()
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
// the "ON DELETE CASCADE" in the table definitions (migrations/001_init.sql).
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
// (links), imageUrl (the uploaded file's URL, for photos and generic files
// alike), content (notes), note (a free-text annotation on top of any item
// type, e.g. "watch this before the meeting"). Any field not relevant to
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
    note = null,
    // AI-generated metadata (see lib/ai.js) — set when the auto-sort agent
    // classified this item; left null for manually-filed items.
    summary = null,
    tags = null,
  } = data;

  const rows = await sql`
    INSERT INTO items
      (folder_id, type, title, url, favicon_url, description, image_url, content, note, summary, tags)
    VALUES
      (${folderId}, ${type}, ${title}, ${url}, ${faviconUrl}, ${description}, ${imageUrl}, ${content}, ${note}, ${summary}, ${tags})
    RETURNING *`;
  return rows[0];
}

// Applies AI-generated summary/tags to an item after the fact — used when
// the auto-sort agent finishes classifying an item that was already saved
// (so the item appears instantly, then gets tagged a moment later).
export async function updateItemAiMetadata(id, { summary, tags }) {
  const rows = await sql`
    UPDATE items SET summary = ${summary}, tags = ${tags}, updated_at = now()
    WHERE id = ${id}
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

// Updates the free-text annotation on any item (link, photo, or note) —
// distinct from `content`, which is the body of a note-type item itself.
export async function updateItemNote(id, note) {
  const rows = await sql`
    UPDATE items SET note = ${note}, updated_at = now()
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

// Escapes the characters ILIKE treats as wildcards (% and _), so searching
// for "100%" means a literal percent sign rather than "100 followed by
// anything".
function likePattern(query) {
  return `%${query.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

// Searches every text field an item has — title, note body, URL,
// annotation, link description, AI summary, and AI tags — in one go. ILIKE
// is Postgres's case-insensitive "contains" match — good enough for a
// personal archive at this scale without needing a dedicated search engine.
// The folder's name comes along so results can say where each item lives.
export async function searchItems(query) {
  const pattern = likePattern(query);
  return sql`
    SELECT items.*, folders.name AS folder_name
    FROM items
    LEFT JOIN folders ON folders.id = items.folder_id
    WHERE items.title ILIKE ${pattern}
       OR items.content ILIKE ${pattern}
       OR items.url ILIKE ${pattern}
       OR items.note ILIKE ${pattern}
       OR items.description ILIKE ${pattern}
       OR items.summary ILIKE ${pattern}
       OR array_to_string(items.tags, ' ') ILIKE ${pattern}
    ORDER BY items.created_at DESC
    LIMIT 50`;
}

// Every item carrying one exact tag, across all folders (newest first).
// `= ANY(tags)` checks whether the value is one of the array's entries.
export async function getItemsByTag(tag) {
  return sql`
    SELECT items.*, folders.name AS folder_name
    FROM items
    LEFT JOIN folders ON folders.id = items.folder_id
    WHERE ${tag} = ANY(items.tags)
    ORDER BY items.created_at DESC`;
}
