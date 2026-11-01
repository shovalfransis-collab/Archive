import { NextResponse } from 'next/server';
import { getAllFolders, getAllItems } from '@/lib/db';
import { withErrors } from '@/lib/api';

// Downloads a backup of the whole archive as one JSON file: every folder
// (with parent_id, so the tree can be rebuilt) and every item (links,
// notes, annotations, AI tags...). Photos and uploaded files are included
// as their storage URLs, not the files themselves.
export const GET = withErrors(async () => {
  const [folders, items] = await Promise.all([getAllFolders(), getAllItems()]);

  const backup = {
    app: 'the-archive',
    version: 1, // bump if the shape of this file ever changes
    exportedAt: new Date().toISOString(),
    counts: { folders: folders.length, items: items.length },
    folders,
    items,
  };

  const date = backup.exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // "attachment" makes the browser download it instead of showing it.
      'Content-Disposition': `attachment; filename="the-archive-backup-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
