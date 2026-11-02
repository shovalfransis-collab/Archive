// Rules for uploading photos and files, shared by the browser (to give a
// clear message before even trying) and the server (which enforces them
// when it hands out an upload token — see app/api/upload/route.js).

// Generous enough for phone photos, short videos and big PDFs. Raise it if
// you need to — Vercel Blob itself allows far larger files.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export const UPLOAD_KINDS = ['photo', 'file'];

// Which file types each kind accepts. Photos must be images; "file" takes
// anything. null = no restriction.
export function allowedContentTypesFor(kind) {
  return kind === 'photo' ? ['image/*'] : null;
}

// Returns an error message if this file can't be uploaded, or null if OK.
export function checkUpload({ size, type }, kind) {
  if (!UPLOAD_KINDS.includes(kind)) return 'Unknown upload type.';
  if (!size) return 'That file is empty.';
  if (size > MAX_UPLOAD_BYTES) {
    const mb = (size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB — the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`;
  }
  if (kind === 'photo' && type && !type.startsWith('image/')) return 'That isn\'t an image.';
  return null;
}

// Turns a filename into a safe storage path: keeps letters, numbers, dots,
// dashes and underscores (so "My Photo (1).jpg" → "My-Photo-1-.jpg"), and
// caps its length. Storage adds a random suffix, so names never clash.
export function uploadPathname(filename) {
  const base = String(filename || 'upload')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(-100);
  return `uploads/${base || 'upload'}`;
}
