// Checks the JSON bodies sent to the API before anything touches the
// database, so bad input gets a clear "400 Bad Request" message instead of
// a crash. Each function returns either { data } (cleaned-up values, safe
// to use) or { error } (a message to show).

export const ITEM_TYPES = ['link', 'photo', 'note', 'file'];
const MAX_NAME = 100;
const MAX_TEXT = 100_000; // note bodies can be long, but not unbounded

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A positive whole-number id, from a number or a numeric string ("12").
// Returns null for anything else.
export function toId(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(n) && n > 0 ? n : null;
}

function folderName(value) {
  if (typeof value !== 'string' || !value.trim()) return { error: 'Folder name can’t be empty.' };
  if (value.trim().length > MAX_NAME) return { error: `Folder name must be ${MAX_NAME} characters or less.` };
  return { value: value.trim() };
}

// An emoji (or a few characters). Empty / null resets to the default 📁.
function folderIcon(value) {
  if (value === null || value === '') return { value: null };
  if (typeof value !== 'string' || [...value.trim()].length > 16) {
    return { error: 'Icon must be a short emoji.' };
  }
  return { value: value.trim() || null };
}

// Optional text: missing → undefined (leave alone), '' or null → null.
function optionalText(value, label, max = MAX_TEXT) {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { error: `${label} must be text.` };
  if (value.length > max) return { error: `${label} is too long.` };
  return { value };
}

// POST /api/folders — { name, parentId?, icon? }
export function validateNewFolder(body) {
  if (!isObject(body)) return { error: 'Expected a JSON object.' };
  const name = folderName(body.name);
  if (name.error) return name;
  let parentId = null;
  if (body.parentId !== undefined && body.parentId !== null) {
    parentId = toId(body.parentId);
    if (!parentId) return { error: 'parentId must be a folder id or null.' };
  }
  const icon = body.icon === undefined ? { value: null } : folderIcon(body.icon);
  if (icon.error) return icon;
  return { data: { name: name.value, parentId, icon: icon.value } };
}

// PATCH /api/folders/:id — any of { name, parentId, icon }
export function validateFolderPatch(body) {
  if (!isObject(body)) return { error: 'Expected a JSON object.' };
  const data = {};
  if (body.name !== undefined) {
    const name = folderName(body.name);
    if (name.error) return name;
    data.name = name.value;
  }
  if (body.parentId !== undefined) {
    if (body.parentId === null) data.parentId = null;
    else {
      data.parentId = toId(body.parentId);
      if (!data.parentId) return { error: 'parentId must be a folder id or null.' };
    }
  }
  if (body.icon !== undefined) {
    const icon = folderIcon(body.icon);
    if (icon.error) return icon;
    data.icon = icon.value;
  }
  if (Object.keys(data).length === 0) return { error: 'Nothing to update.' };
  return { data };
}

// PATCH /api/items/:id — any of { title, content, note, folderId }
export function validateItemPatch(body) {
  if (!isObject(body)) return { error: 'Expected a JSON object.' };
  const data = {};
  for (const [key, label, max] of [
    ['title', 'Title', 500],
    ['content', 'Note text', MAX_TEXT],
    ['note', 'Note', MAX_TEXT],
  ]) {
    const checked = optionalText(body[key], label, max);
    if (checked.error) return checked;
    if (checked.value !== undefined) data[key] = checked.value;
  }
  if (body.folderId !== undefined) {
    data.folderId = toId(body.folderId);
    if (!data.folderId) return { error: 'folderId must be a folder id.' };
  }
  if (Object.keys(data).length === 0) return { error: 'Nothing to update.' };
  return { data };
}

// POST /api/items — a new link/photo/note/file. folderId null/missing
// means "let the AI choose".
export function validateNewItem(body) {
  if (!isObject(body)) return { error: 'Expected a JSON object.' };
  if (!ITEM_TYPES.includes(body.type)) {
    return { error: `type must be one of: ${ITEM_TYPES.join(', ')}.` };
  }
  let folderId = null;
  if (body.folderId !== undefined && body.folderId !== null) {
    folderId = toId(body.folderId);
    if (!folderId) return { error: 'folderId must be a folder id or null.' };
  }
  const data = { type: body.type, folderId };
  for (const [key, max] of [
    ['title', 500],
    ['url', 4000],
    ['faviconUrl', 4000],
    ['description', 5000],
    ['imageUrl', 4000],
    ['content', MAX_TEXT],
    ['note', MAX_TEXT],
  ]) {
    const checked = optionalText(body[key], key, max);
    if (checked.error) return checked;
    data[key] = checked.value ?? null;
  }
  if (body.type === 'link' && !data.url) return { error: 'A link needs a url.' };
  if ((body.type === 'photo' || body.type === 'file') && !data.imageUrl) {
    return { error: 'An upload needs its imageUrl.' };
  }
  if (body.type === 'note' && !data.content?.trim()) return { error: 'A note can’t be empty.' };
  return { data };
}
