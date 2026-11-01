import { NextResponse } from 'next/server';
import { searchItems } from '@/lib/db';
import { withErrors } from '@/lib/api';

export const GET = withErrors(async (request) => {
  const { searchParams } = new URL(request.url);
  // Capped so a pasted essay doesn't become a giant database query.
  const q = (searchParams.get('q') || '').trim().slice(0, 200);

  if (!q) return NextResponse.json([]);

  const results = await searchItems(q);
  return NextResponse.json(results);
});
