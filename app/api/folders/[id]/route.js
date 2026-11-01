import { NextResponse } from 'next/server';
import { renameFolder, moveFolder, updateFolderIcon, deleteFolder, getAllFolders } from '@/lib/db';
import { canMoveFolder } from '@/lib/folderTree';

// Handles renaming (body: { name }), moving (body: { parentId }), and
// changing the icon (body: { icon }) — whichever fields are present in the
// request body.
export async function PATCH(request, { params }) {
  const { id: idParam } = await params; // route params are a Promise in current Next.js
  const id = Number(idParam);
  const body = await request.json();
  let folder;

  if (body.parentId !== undefined) {
    // Checked first, so an invalid move doesn't leave a half-applied
    // update (e.g. renamed but not moved).
    // null means "top level"; anything else must be a real folder id.
    const parentId = body.parentId === null ? null : Number(body.parentId);
    const folders = await getAllFolders();
    if (!folders.some((f) => f.id === id)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    // Checked on the server too (not just hidden in the picker), since a
    // loop would make the folder and everything in it vanish from the tree.
    if (!canMoveFolder(folders, id, parentId)) {
      return NextResponse.json(
        { error: "A folder can't be moved inside itself or one of its own subfolders." },
        { status: 400 }
      );
    }
    folder = await moveFolder(id, parentId);
  }
  if (body.name !== undefined) {
    folder = await renameFolder(id, body.name.trim());
  }
  if (body.icon !== undefined) {
    folder = await updateFolderIcon(id, body.icon);
  }

  return NextResponse.json(folder);
}

export async function DELETE(request, { params }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  await deleteFolder(id); // also deletes every subfolder and item inside it
  return NextResponse.json({ ok: true });
}
