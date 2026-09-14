import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Receives a photo as multipart form data and streams it straight to
// Vercel Blob storage (serverless hosting can't keep uploaded files on
// its own disk — they'd vanish on the next deploy — so the file needs a
// proper storage bucket instead). Returns the public URL to save on the item.
export async function POST(request) {
  const form = await request.formData();
  const file = form.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const blob = await put(`photos/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
