import { NextResponse } from 'next/server';
import { renameFolder, moveFolder, updateFolderIcon, deleteFolder } from '@/lib/db';

// Handles renaming (body: { name }), moving (body: { parentId }), and
// changing the icon (body: { icon }) — whichever fields are present in the
// request body.
export async function PATCH(request, { params }) {
  const { id: idParam } = await params; // route params are a Promise in current Next.js
  const id = Number(idParam);
  const body = await request.json();
  let folder;

  if (body.name !== undefined) {
    folder = await renameFolder(id, body.name.trim());
  }
  if (body.parentId !== undefined) {
    folder = await moveFolder(id, body.parentId);
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
