import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseClassification } from '../lib/ai.js';

const folders = [
  { id: 1, name: 'Recipes', parent_id: null },
  { id: 2, name: 'Music', parent_id: null },
];
const parse = (obj) => parseClassification(JSON.stringify(obj), folders);

test('accepts a valid existing folder', () => {
  const r = parse({ folderId: 2, newFolderName: null, summary: 'A song', tags: ['music'] });
  assert.deepEqual(r, { folderId: 2, newFolderName: null, summary: 'A song', tags: ['music'] });
});

test('accepts a folder id sent as a string', () => {
  assert.equal(parse({ folderId: '1' }).folderId, 1);
});

test('rejects a folder id that does not exist', () => {
  const r = parse({ folderId: 99, newFolderName: null });
  assert.equal(r.folderId, null);
});

test('uses the new folder name when there is no valid folder id', () => {
  const r = parse({ folderId: 99, newFolderName: '  Travel Plans  ' });
  assert.equal(r.folderId, null);
  assert.equal(r.newFolderName, 'Travel Plans');
});

test('when both are set, the existing folder wins', () => {
  const r = parse({ folderId: 1, newFolderName: 'Something Else' });
  assert.equal(r.folderId, 1);
  assert.equal(r.newFolderName, null);
});

test('when neither is set, both come back null (item goes to Unsorted)', () => {
  const r = parse({ folderId: null, newFolderName: '   ', summary: 'x' });
  assert.equal(r.folderId, null);
  assert.equal(r.newFolderName, null);
  assert.equal(r.summary, 'x');
});

test('returns null for bad or empty JSON', () => {
  assert.equal(parseClassification('not json', folders), null);
  assert.equal(parseClassification('', folders), null);
  assert.equal(parseClassification(undefined, folders), null);
  assert.equal(parseClassification('[1,2]', folders), null);
  assert.equal(parseClassification('null', folders), null);
});

test('reads JSON wrapped in markdown code fences', () => {
  const r = parseClassification('```json\n{"folderId": 1}\n```', folders);
  assert.equal(r.folderId, 1);
});

test('keeps only string tags, cleaned up and capped at 5', () => {
  const r = parse({ folderId: 1, tags: ['Food', 42, null, { a: 1 }, '#Dinner', ' ', 'food', 'a', 'b', 'c', 'd'] });
  assert.deepEqual(r.tags, ['food', 'dinner', 'a', 'b', 'c']);
});

test('tags that are not an array, or end up empty, become null', () => {
  assert.equal(parse({ folderId: 1, tags: 'food' }).tags, null);
  assert.equal(parse({ folderId: 1, tags: [1, 2] }).tags, null);
});

test('caps a long summary at 200 characters', () => {
  const r = parse({ folderId: 1, summary: 'x'.repeat(500) });
  assert.equal(r.summary.length, 200);
});

test('a non-string summary becomes null', () => {
  assert.equal(parse({ folderId: 1, summary: 123 }).summary, null);
});
