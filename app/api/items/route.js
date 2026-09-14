import { NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');

  if (!folderId) {
    return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
  }

  const items = await getItems(Number(folderId));
  return NextResponse.json(items);
}

export async function POST(request) {
  const data = await request.json();

  if (!data.folderId || !data.type) {
    return NextResponse.json({ error: 'folderId and type are required' }, { status: 400 });
  }

  const item = await createItem(data);
  return NextResponse.json(item);
}
