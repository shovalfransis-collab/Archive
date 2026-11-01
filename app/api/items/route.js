import { NextResponse } from 'next/server';
import { createItem, getItems, getAllFolders, createFolder, getFolder } from '@/lib/db';
import { jsonError, readJson, withErrors } from '@/lib/api';
import { toId, validateNewItem } from '@/lib/validate';
import { classifyItem } from '@/lib/ai';

export const GET = withErrors(async (request) => {
  const { searchParams } = new URL(request.url);
  const folderId = toId(searchParams.get('folderId'));
  if (!folderId) return jsonError('folderId is required');

  const items = await getItems(folderId);
  return NextResponse.json(items);
});

export const POST = withErrors(async (request) => {
  const { data, error } = validateNewItem(await readJson(request));
  if (error) return jsonError(error);

  // If the browser didn't pick a folder, this is the "let AI sort it" path
  // (see QuickAddModal) — ask OpenRouter which folder fits, or invent one,
  // then tag/summarize the item before saving it. `autoSorted`/`folderInfo`
  // travel back to the browser so it can show a "Filed in X" toast.
  if (!data.folderId) {
    const folders = await getAllFolders();
    const classification = await classifyItem(data, folders);

    let folderId = null;
    let folderName = null;
    let folderIsNew = false;

    if (classification?.folderId) {
      folderId = classification.folderId;
      folderName = folders.find((f) => f.id === folderId)?.name ?? null;
    } else if (classification?.newFolderName) {
      const newFolder = await createFolder(classification.newFolderName, null, null);
      folderId = newFolder.id;
      folderName = newFolder.name;
      folderIsNew = true;
    } else {
      // AI is unavailable/failed — fall back to an "Unsorted" catch-all
      // folder rather than silently dropping the item.
      const existingUnsorted = folders.find(
        (f) => !f.parent_id && f.name.toLowerCase() === 'unsorted'
      );
      const unsorted = existingUnsorted || (await createFolder('Unsorted', null, null));
      folderId = unsorted.id;
      folderName = unsorted.name;
      folderIsNew = !existingUnsorted;
    }

    const item = await createItem({
      ...data,
      folderId,
      summary: classification?.summary ?? null,
      tags: classification?.tags ?? null,
    });

    return NextResponse.json(
      {
        ...item,
        autoSorted: true,
        folderName,
        folderIsNew,
      },
      { status: 201 }
    );
  }

  if (!(await getFolder(data.folderId))) {
    return jsonError('The folder you picked no longer exists.', 404);
  }
  const item = await createItem(data);
  return NextResponse.json(item, { status: 201 });
});
