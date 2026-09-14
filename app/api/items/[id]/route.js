import { NextResponse } from 'next/server';
import { updateItemTitle, updateNoteContent, moveItem, deleteItem } from '@/lib/db';

// Handles renaming (body: { title }), editing note text (body: { content }),
// and moving an item to a different folder (body: { folderId }) — whichever
// field is present in the request body.
export async function PATCH(request, { params }) {
  const { id: idParam } = await params; // route params are a Promise in current Next.js
  const id = Number(idParam);
  const body = await request.json();
  let item;

  if (body.title !== undefined) {
    item = await updateItemTitle(id, body.title);
  }
  if (body.content !== undefined) {
    item = await updateNoteContent(id, body.content);
  }
  if (body.folderId !== undefined) {
    item = await moveItem(id, body.folderId);
  }

  return NextResponse.json(item);
}

export async function DELETE(request, { params }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  await deleteItem(id);
  return NextResponse.json({ ok: true });
}
