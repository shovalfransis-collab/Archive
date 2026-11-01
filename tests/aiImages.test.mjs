import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { imageUrlForItem, buildUserContent, classifyItem } from '../lib/ai.js';

const BLOB = 'https://abc.public.blob.vercel-storage.com/uploads';

test('photos always send their image', () => {
  assert.equal(imageUrlForItem({ type: 'photo', imageUrl: `${BLOB}/x.heic` }), `${BLOB}/x.heic`);
  assert.equal(imageUrlForItem({ type: 'photo', image_url: `${BLOB}/x.jpg` }), `${BLOB}/x.jpg`);
});

test('files send their image only when they are an image format', () => {
  assert.equal(imageUrlForItem({ type: 'file', imageUrl: `${BLOB}/scan.PNG` }), `${BLOB}/scan.PNG`);
  assert.equal(imageUrlForItem({ type: 'file', imageUrl: `${BLOB}/a.webp?download=1` }), `${BLOB}/a.webp?download=1`);
  assert.equal(imageUrlForItem({ type: 'file', imageUrl: `${BLOB}/report.pdf` }), null);
  assert.equal(imageUrlForItem({ type: 'file', imageUrl: 'not a url' }), null);
});

test('links and notes never send an image', () => {
  assert.equal(imageUrlForItem({ type: 'link', url: 'https://x.com/a.jpg' }), null);
  assert.equal(imageUrlForItem({ type: 'note', content: 'hi' }), null);
});

test('buildUserContent is plain text without an image, multi-part with one', () => {
  assert.equal(buildUserContent('hello', null), 'hello');
  assert.deepEqual(buildUserContent('hello', 'https://i/x.jpg'), [
    { type: 'text', text: 'hello' },
    { type: 'image_url', image_url: { url: 'https://i/x.jpg' } },
  ]);
});

// ---- classifyItem with a fake network --------------------------------------

const folders = [{ id: 1, name: 'Pets', parent_id: null }];
const reply = (obj) =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(obj) } }] }), { status: 200 });

let realFetch;
let calls;
beforeEach(() => {
  realFetch = globalThis.fetch;
  calls = [];
  process.env.OPENROUTER_API_KEY = 'test-key';
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.OPENROUTER_API_KEY;
});

function fakeFetch(handler) {
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.messages[1].content);
    return handler(body, calls.length);
  };
}

test('a photo is classified from the image when that works', async () => {
  fakeFetch(() => reply({ folderId: 1, summary: 'A dog', tags: ['dog'] }));
  const r = await classifyItem({ type: 'photo', title: 'IMG_1.jpg', imageUrl: `${BLOB}/IMG_1.jpg` }, folders);
  assert.equal(r.folderId, 1);
  assert.equal(calls.length, 1);
  assert.ok(Array.isArray(calls[0]), 'first request includes the image');
});

test('if the image request fails, it retries text-only', async () => {
  const quietWarn = console.warn;
  console.warn = () => {};
  try {
    fakeFetch((body, n) => (n === 1 ? new Response('no vision', { status: 400 }) : reply({ folderId: 1 })));
    const r = await classifyItem({ type: 'photo', title: 'IMG_1.jpg', imageUrl: `${BLOB}/IMG_1.jpg` }, folders);
    assert.equal(r.folderId, 1);
    assert.equal(calls.length, 2);
    assert.equal(typeof calls[1], 'string', 'retry is text only');
  } finally {
    console.warn = quietWarn;
  }
});

test('links make a single text-only request', async () => {
  fakeFetch(() => reply({ newFolderName: 'Reading' }));
  const r = await classifyItem({ type: 'link', url: 'https://example.com' }, folders);
  assert.equal(r.newFolderName, 'Reading');
  assert.equal(calls.length, 1);
  assert.equal(typeof calls[0], 'string');
});
