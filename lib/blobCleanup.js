// Deletes uploaded photos/files from Vercel Blob storage once the item (or
// folder) that used them is deleted — otherwise they'd sit in storage
// forever, still costing space and still reachable by URL.
//
// Best effort by design: if storage can't be reached, the problem is
// logged and the delete in the app still counts as done. (A leftover file
// is far less bad than an item you can't delete.)
import { del } from '@vercel/blob';

// Only URLs that point into Vercel Blob storage — never anything else
// that might be in an image_url column.
export function blobUrlsToDelete(urls) {
  const unique = new Set();
  for (const value of urls) {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com')) {
        unique.add(url.toString());
      }
    } catch {
      // not a URL — ignore
    }
  }
  return [...unique];
}

// `remove` is swappable only for tests.
export async function deleteUploadedFiles(urls, { remove = del } = {}) {
  const targets = blobUrlsToDelete(urls);
  if (targets.length === 0) return;
  try {
    await remove(targets); // del() accepts many URLs at once
  } catch (err) {
    console.error(`[blob] Couldn't delete ${targets.length} stored file(s):`, targets, err);
  }
}
