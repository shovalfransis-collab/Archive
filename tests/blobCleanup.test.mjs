import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blobUrlsToDelete, deleteUploadedFiles } from '../lib/blobCleanup.js';

const A = 'https://abc123.public.blob.vercel-storage.com/uploads/cat-x1y2.jpg';
const B = 'https://abc123.public.blob.vercel-storage.com/uploads/doc-z9.pdf';

test('only Vercel Blob URLs are deleted, each once', () => {
  assert.deepEqual(
    blobUrlsToDelete([A, A, B, 'https://example.com/a.jpg', 'http://x.blob.vercel-storage.com/a', 'nope', null]),
    [A, B]
  );
  assert.deepEqual(
    blobUrlsToDelete(['https://evil.com/?x=.blob.vercel-storage.com', 'https://blob.vercel-storage.com.evil.com/a']),
    []
  );
});

test('deletes all files in one call', async () => {
  const calls = [];
  await deleteUploadedFiles([A, B], { remove: async (urls) => calls.push(urls) });
  assert.deepEqual(calls, [[A, B]]);
});

test('does nothing when there are no stored files', async () => {
  let called = false;
  await deleteUploadedFiles(['https://example.com/x.png'], { remove: async () => (called = true) });
  assert.equal(called, false);
});

test('a storage failure is logged, not thrown', async () => {
  const realError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  try {
    await deleteUploadedFiles([A], {
      remove: async () => {
        throw new Error('storage down');
      },
    });
  } finally {
    console.error = realError;
  }
  assert.equal(logged.length, 1);
});
