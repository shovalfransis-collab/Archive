import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseItemQuery } from '../lib/itemQuery.js';

test('defaults to newest first, all types', () => {
  assert.deepEqual(parseItemQuery({}), { sort: 'newest', type: null });
  assert.deepEqual(parseItemQuery(), { sort: 'newest', type: null });
});

test('accepts known values', () => {
  assert.deepEqual(parseItemQuery({ sort: 'name', type: 'photo' }), { sort: 'name', type: 'photo' });
  assert.deepEqual(parseItemQuery({ sort: 'oldest', type: 'file' }), { sort: 'oldest', type: 'file' });
});

test('"all" means no type filter', () => {
  assert.equal(parseItemQuery({ type: 'all' }).type, null);
});

test('unknown or hostile values fall back to defaults', () => {
  assert.deepEqual(parseItemQuery({ sort: 'id; DROP TABLE items', type: 'video' }), {
    sort: 'newest',
    type: null,
  });
});

test('repeated URL params use the first one', () => {
  assert.deepEqual(parseItemQuery({ sort: ['name', 'oldest'], type: ['note'] }), {
    sort: 'name',
    type: 'note',
  });
});
