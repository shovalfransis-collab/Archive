import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { COOKIE_NAME, isValidSessionToken } from '@/lib/auth';
import { MAX_UPLOAD_BYTES, UPLOAD_KINDS, allowedContentTypesFor } from '@/lib/uploadRules';

// Photos and files are uploaded by the browser straight to Vercel Blob
// storage — they no longer pass through this server, because Vercel caps a
// request to a server function at ~4.5 MB, which many phone photos exceed.
//
// This route's only job is to hand the browser a short-lived "upload
// token" (via handleUpload) saying what it may upload: only if you're
// logged in, only up to MAX_UPLOAD_BYTES, only images for photos, and
// always under a random-suffixed name so URLs can't be guessed.
//
// We don't use Vercel's "upload completed" callback: the browser saves the
// item itself once the upload finishes (see components/QuickAddModal.js).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad upload request' }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // The proxy already blocks logged-out visitors, but this is what
        // grants write access to storage, so check again right here.
        const token = request.cookies.get(COOKIE_NAME)?.value;
        if (!(await isValidSessionToken(token))) {
          throw new Error('Not logged in');
        }
        const kind = UPLOAD_KINDS.includes(clientPayload) ? clientPayload : 'file';
        return {
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          allowedContentTypes: allowedContentTypesFor(kind) ?? undefined,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[upload] could not create upload token:', err);
    const status = err.message === 'Not logged in' ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
