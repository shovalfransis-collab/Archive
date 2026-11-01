import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toId,
  validateNewFolder,
  validateFolderPatch,
  validateItemPatch,
  validateNewItem,
} from '../lib/validate.js';

test('toId accepts positive whole numbers and numeric strings only', () => {
  assert.equal(toId(5), 5);
  assert.equal(toId('12'), 12);
  for (const bad of [0, -1, 1.5, '', ' ', 'abc', '1e3x', null, undefined, {}, NaN]) {
    assert.equal(toId(bad), null, `toId(${JSON.stringify(bad)})`);
  }
});

test('new folder: trims the name, defaults parent and icon', () => {
  assert.deepEqual(validateNewFolder({ name: '  Recipes ' }).data, { name: 'Recipes', parentId: null, icon: null });
  assert.deepEqual(validateNewFolder({ name: 'A', parentId: '3', icon: '🍳' }).data, { name: 'A', parentId: 3, icon: '🍳' });
});

test('new folder: rejects missing/blank/long names and bad parents', () => {
  assert.ok(validateNewFolder({}).error);
  assert.ok(validateNewFolder({ name: '   ' }).error);
  assert.ok(validateNewFolder({ name: 42 }).error);
  assert.ok(validateNewFolder({ name: 'x'.repeat(101) }).error);
  assert.ok(validateNewFolder({ name: 'A', parentId: 'nope' }).error);
  assert.ok(validateNewFolder(null).error);
  assert.ok(validateNewFolder([]).error);
});

test('folder patch: only includes what was sent', () => {
  assert.deepEqual(validateFolderPatch({ name: ' New ' }).data, { name: 'New' });
  assert.deepEqual(validateFolderPatch({ parentId: null }).data, { parentId: null });
  assert.deepEqual(validateFolderPatch({ icon: '' }).data, { icon: null });
  assert.deepEqual(validateFolderPatch({ icon: '👨‍👩‍👧‍👦' }).data, { icon: '👨‍👩‍👧‍👦' });
});

test('folder patch: rejects empty names, bad ids, long icons, and empty bodies', () => {
  assert.ok(validateFolderPatch({ name: '' }).error);
  assert.ok(validateFolderPatch({ name: null }).error);
  assert.ok(validateFolderPatch({ parentId: 'x' }).error);
  assert.ok(validateFolderPatch({ icon: 'this is not an emoji at all' }).error);
  assert.match(validateFolderPatch({}).error, /Nothing to update/);
});

test('item patch: text fields and folder moves', () => {
  assert.deepEqual(validateItemPatch({ note: 'hi' }).data, { note: 'hi' });
  assert.deepEqual(validateItemPatch({ note: '' }).data, { note: null });
  assert.deepEqual(validateItemPatch({ folderId: '7' }).data, { folderId: 7 });
  assert.ok(validateItemPatch({ folderId: null }).error);
  assert.ok(validateItemPatch({ content: 5 }).error);
  assert.ok(validateItemPatch({ title: 'x'.repeat(501) }).error);
  assert.ok(validateItemPatch({}).error);
});

test('new item: each type needs its main field', () => {
  assert.ok(validateNewItem({ type: 'link', url: 'https://x.com' }).data);
  assert.ok(validateNewItem({ type: 'note', content: 'hello', folderId: 2 }).data);
  assert.ok(validateNewItem({ type: 'photo', imageUrl: 'https://b/x.jpg' }).data);
  assert.ok(validateNewItem({ type: 'file', imageUrl: 'https://b/x.pdf' }).data);
  assert.ok(validateNewItem({ type: 'link' }).error);
  assert.ok(validateNewItem({ type: 'note', content: '  ' }).error);
  assert.ok(validateNewItem({ type: 'photo' }).error);
  assert.ok(validateNewItem({ type: 'video', url: 'x' }).error);
  assert.ok(validateNewItem({ type: 'link', url: 'https://x.com', folderId: 'abc' }).error);
});

test('new item: folderId null means "let the AI choose"; unknown fields are dropped', () => {
  const { data } = validateNewItem({ type: 'link', url: 'https://x.com', folderId: null, evil: 1 });
  assert.equal(data.folderId, null);
  assert.equal(data.evil, undefined);
  assert.equal(data.note, null);
});

import { isWebUrl } from '../lib/validate.js';

test('links must be http(s)', () => {
  assert.ok(validateNewItem({ type: 'link', url: 'http://x.com' }).data);
  for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'x.com', 'vbscript:x']) {
    assert.match(validateNewItem({ type: 'link', url: bad }).error, /http/, bad);
  }
});

test('uploads must be http(s); a bad favicon is just dropped', () => {
  assert.ok(validateNewItem({ type: 'photo', imageUrl: 'javascript:x' }).error);
  const { data } = validateNewItem({ type: 'link', url: 'https://x.com', faviconUrl: 'javascript:x' });
  assert.equal(data.faviconUrl, null);
});

test('isWebUrl', () => {
  assert.equal(isWebUrl('https://a.b/c'), true);
  assert.equal(isWebUrl('HTTP://A.B'), true);
  assert.equal(isWebUrl('/relative'), false);
  assert.equal(isWebUrl(''), false);
});
