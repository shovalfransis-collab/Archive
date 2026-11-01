import { NextResponse } from 'next/server';
import { renameFolder, moveFolder, updateFolderIcon, deleteFolder, getAllFolders } from '@/lib/db';
import { canMoveFolder } from '@/lib/folderTree';
import { jsonError, readJson, withErrors } from '@/lib/api';
import { toId, validateFolderPatch } from '@/lib/validate';

// Handles renaming (body: { name }), moving (body: { parentId }), and
// changing the icon (body: { icon }) — whichever fields are present in the
// request body. Everything is checked before anything is changed, so a bad
// request never leaves a half-applied update (e.g. renamed but not moved).
export const PATCH = withErrors(async (request, { params }) => {
  const { id: idParam } = await params; // route params are a Promise in current Next.js
  const id = toId(idParam);
  if (!id) return jsonError('Folder not found', 404);

  const { data, error } = validateFolderPatch(await readJson(request));
  if (error) return jsonError(error);

  const folders = await getAllFolders();
  if (!folders.some((f) => f.id === id)) return jsonError('Folder not found', 404);

  if (data.parentId !== undefined) {
    if (data.parentId !== null && !folders.some((f) => f.id === data.parentId)) {
      return jsonError('The folder you picked no longer exists.', 404);
    }
    // Checked on the server too (not just hidden in the picker), since a
    // loop would make the folder and everything in it vanish from the tree.
    if (!canMoveFolder(folders, id, data.parentId)) {
      return jsonError("A folder can't be moved inside itself or one of its own subfolders.");
    }
  }

  let folder;
  if (data.parentId !== undefined) folder = await moveFolder(id, data.parentId);
  if (data.name !== undefined) folder = await renameFolder(id, data.name);
  if (data.icon !== undefined) folder = await updateFolderIcon(id, data.icon);

  return NextResponse.json(folder);
});

export const DELETE = withErrors(async (request, { params }) => {
  const { id: idParam } = await params;
  const id = toId(idParam);
  // Also deletes every subfolder and item inside it (ON DELETE CASCADE).
  if (!id || !(await deleteFolder(id))) return jsonError('Folder not found', 404);
  return NextResponse.json({ ok: true });
});
