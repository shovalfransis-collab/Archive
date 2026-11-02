import { headers } from 'next/headers';
import SharedSave from '@/components/SharedSave';
import { extractShared } from '@/lib/shareInput';
import { isValidShareKey } from '@/lib/auth';

// Never cache: every visit is a new thing to save.
export const dynamic = 'force-dynamic';

// /add?url=…&title=…&text=… — what the bookmarklet and the iPhone Shortcut
// open (see /save-anywhere), and what /share (Android) reuses. Saves the
// link (or text, as a note) and lets the AI pick the folder.
//
// It saves immediately only when it's clearly you who opened it (see
// makeShareKey in lib/auth.js): the link carries your secret key, or the
// browser reports `Sec-Fetch-Site: none` — meaning it was opened directly
// (share menu, bookmark, typed), not sent here by some other website.
// Otherwise it shows a "Save this?" button first.
export default async function AddPage({ searchParams }) {
  const params = await searchParams;
  const shared = extractShared(params);
  const h = await headers();
  const key = Array.isArray(params.key) ? params.key[0] : params.key;
  const autoSave = h.get('sec-fetch-site') === 'none' || (await isValidShareKey(key));

  return <SharedSave url={shared.url} title={shared.title} text={shared.text} autoSave={autoSave} />;
}
