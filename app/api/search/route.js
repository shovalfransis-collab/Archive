import { NextResponse } from 'next/server';
import { searchItems, getAllFolders } from '@/lib/db';
import { withErrors } from '@/lib/api';
import { folderPath } from '@/lib/folderTree';

// Searches every item (see searchItems in lib/db.js). Each result also gets
// `folder_path` — e.g. ['Fun', 'Games'] — so the search box can show where
// it lives, even when it's nested a few folders deep.
export const GET = withErrors(async (request) => {
  const { searchParams } = new URL(request.url);
  // Capped so a pasted essay doesn't become a giant database query.
  const q = (searchParams.get('q') || '').trim().slice(0, 200);

  if (!q) return NextResponse.json([]);

  const [results, folders] = await Promise.all([searchItems(q), getAllFolders()]);
  return NextResponse.json(
    results.map((item) => ({ ...item, folder_path: folderPath(folders, item.folder_id) }))
  );
});
