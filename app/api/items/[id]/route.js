import { NextResponse, after } from 'next/server';
import {
  getItem,
  getFolder,
  updateItemTitle,
  updateNoteContent,
  updateItemNote,
  moveItem,
  deleteItem,
} from '@/lib/db';
import { jsonError, readJson, withErrors } from '@/lib/api';
import { deleteUploadedFiles } from '@/lib/blobCleanup';
import { toId, validateItemPatch } from '@/lib/validate';

// Handles renaming (body: { title }), editing a note item's body
// (body: { content }), editing the annotation attached to any item
// (body: { note }), and moving an item to a different folder
// (body: { folderId }) — whichever fields are present in the request body.
// Everything is checked before anything is changed.
export const PATCH = withErrors(async (request, { params }) => {
  const { id: idParam } = await params; // route params are a Promise in current Next.js
  const id = toId(idParam);
  if (!id) return jsonError('Item not found', 404);

  const { data, error } = validateItemPatch(await readJson(request));
  if (error) return jsonError(error);

  if (!(await getItem(id))) return jsonError('Item not found', 404);
  if (data.folderId !== undefined && !(await getFolder(data.folderId))) {
    return jsonError('The folder you picked no longer exists.', 404);
  }

  let item;
  if (data.title !== undefined) item = await updateItemTitle(id, data.title);
  if (data.content !== undefined) item = await updateNoteContent(id, data.content);
  if (data.note !== undefined) item = await updateItemNote(id, data.note);
  if (data.folderId !== undefined) item = await moveItem(id, data.folderId);

  return NextResponse.json(item);
});

export const DELETE = withErrors(async (request, { params }) => {
  const { id: idParam } = await params;
  const id = toId(idParam);
  const deleted = id ? await deleteItem(id) : null;
  if (!deleted) return jsonError('Item not found', 404);
  // Remove its photo/file from storage after replying, so you don't wait
  // for it; failures are only logged (lib/blobCleanup.js).
  if (deleted.image_url) after(() => deleteUploadedFiles([deleted.image_url]));
  return NextResponse.json({ ok: true });
});
