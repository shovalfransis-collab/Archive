// Browser-side helpers for saving things to the archive, shared by the
// quick-add "+" modal and the share / bookmarklet page (/add).
import { apiRequest } from './apiClient';

// Asks the server for a link's title/description/favicon. Best effort: if
// it fails for any reason you get {} and the link is saved anyway.
export async function fetchLinkPreview(url) {
  try {
    const res = await fetch('/api/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

// Saves one item. With no folderId, the server lets the AI pick a folder
// and the reply includes { autoSorted, folderName, folderIsNew }.
// Throws a readable error if the save didn't work.
export async function saveItem(body) {
  return apiRequest('/api/items', { method: 'POST', body });
}

// Fetches a link's preview, then saves it. `fallbackTitle` is used when the
// page's own title couldn't be fetched (e.g. a site that blocks bots but
// whose title the bookmarklet already knew).
export async function saveLink({ url, folderId = null, note = null, fallbackTitle = null }) {
  const preview = await fetchLinkPreview(url);
  const fetchedTitle = preview.title && preview.title !== url ? preview.title : null;
  return saveItem({
    folderId,
    type: 'link',
    url,
    title: fetchedTitle || fallbackTitle || url,
    description: preview.description ?? null,
    faviconUrl: preview.faviconUrl ?? null,
    note: note || null,
  });
}
