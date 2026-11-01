import { NextResponse } from 'next/server';
import { createFolder, getAllFolders, getFolder } from '@/lib/db';
import { jsonError, readJson, withErrors } from '@/lib/api';
import { validateNewFolder } from '@/lib/validate';

// Returns every folder (flat). The client builds the nested tree itself
// via lib/folderTree.js — keeping that logic on the client avoids needing
// a separate "tree" API shape.
export const GET = withErrors(async () => {
  const folders = await getAllFolders();
  return NextResponse.json(folders);
});

// Creates a folder: { name, parentId?, icon? }.
export const POST = withErrors(async (request) => {
  const { data, error } = validateNewFolder(await readJson(request));
  if (error) return jsonError(error);

  if (data.parentId !== null && !(await getFolder(data.parentId))) {
    return jsonError('The parent folder no longer exists.', 404);
  }

  const folder = await createFolder(data.name, data.parentId, data.icon);
  return NextResponse.json(folder, { status: 201 });
});
