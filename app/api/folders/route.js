import { NextResponse } from 'next/server';
import { createFolder, getAllFolders } from '@/lib/db';

// Returns every folder (flat). The client builds the nested tree itself
// via lib/folderTree.js — keeping that logic on the client avoids needing
// a separate "tree" API shape.
export async function GET() {
  const folders = await getAllFolders();
  return NextResponse.json(folders);
}

export async function POST(request) {
  const { name, parentId } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
  }

  const folder = await createFolder(name.trim(), parentId ?? null);
  return NextResponse.json(folder);
}
