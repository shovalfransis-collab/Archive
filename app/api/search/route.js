import { NextResponse } from 'next/server';
import { searchItems } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) return NextResponse.json([]);

  const results = await searchItems(q);
  return NextResponse.json(results);
}
