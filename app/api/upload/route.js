import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Receives a photo or generic file as multipart form data and streams it
// straight to Vercel Blob storage (serverless hosting can't keep uploaded
// files on its own disk — they'd vanish on the next deploy — so the file
// needs a proper storage bucket instead). Returns the public URL to save
// on the item.
export async function POST(request) {
  const form = await request.formData();
  const file = form.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[upload] Blob put failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
