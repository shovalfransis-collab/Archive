import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from '../lib/safeRedirect.js';
import { extractShared } from '../lib/shareInput.js';

test('safeNextPath keeps paths on this site', () => {
  assert.equal(safeNextPath('/'), '/');
  assert.equal(safeNextPath('/folder/3'), '/folder/3');
  assert.equal(
    safeNextPath('/add?url=https%3A%2F%2Fexample.com&title=Hi'),
    '/add?url=https%3A%2F%2Fexample.com&title=Hi'
  );
});

test('safeNextPath refuses anything that leaves the site', () => {
  for (const bad of [
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'javascript:alert(1)',
    'evil.com',
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeNextPath(bad), '/', `should refuse ${JSON.stringify(bad)}`);
  }
});

test('safeNextPath does not send you back to /login', () => {
  assert.equal(safeNextPath('/login?next=/x'), '/');
});

test('extractShared uses the url field when present', () => {
  assert.deepEqual(extractShared({ url: 'https://example.com/a', title: 'Example' }), {
    url: 'https://example.com/a',
    title: 'Example',
    text: null,
  });
});

test('extractShared finds a link inside the text (Android style)', () => {
  assert.deepEqual(
    extractShared({ title: 'Cool video', text: 'Watch this! https://youtu.be/abc123.' }),
    { url: 'https://youtu.be/abc123', title: 'Cool video', text: 'Watch this!' }
  );
});

test('extractShared turns text without a link into a note', () => {
  assert.deepEqual(extractShared({ text: 'Buy milk' }), { url: null, title: null, text: 'Buy milk' });
});

test('extractShared ignores non-web links and empty input', () => {
  assert.equal(extractShared({ url: 'javascript:alert(1)' }).url, null);
  assert.equal(extractShared({ url: 'ftp://x.com/file' }).url, null);
  assert.deepEqual(extractShared({}), { url: null, title: null, text: null });
});

test('extractShared drops text that just repeats the title', () => {
  const r = extractShared({ url: 'https://x.com', title: 'Same', text: 'Same' });
  assert.equal(r.text, null);
});
