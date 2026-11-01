import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkUpload, uploadPathname, allowedContentTypesFor, MAX_UPLOAD_BYTES } from '../lib/uploadRules.js';

test('normal photos and files are fine', () => {
  assert.equal(checkUpload({ size: 3_000_000, type: 'image/jpeg' }, 'photo'), null);
  assert.equal(checkUpload({ size: 9_000_000, type: 'image/heic' }, 'photo'), null);
  assert.equal(checkUpload({ size: 2_000_000, type: 'application/pdf' }, 'file'), null);
});

test('large files over the old 4.5 MB limit are allowed, up to the max', () => {
  assert.equal(checkUpload({ size: 12 * 1024 * 1024, type: 'image/jpeg' }, 'photo'), null);
  assert.equal(checkUpload({ size: MAX_UPLOAD_BYTES, type: 'image/jpeg' }, 'photo'), null);
  assert.match(checkUpload({ size: MAX_UPLOAD_BYTES + 1, type: 'image/jpeg' }, 'photo'), /limit is 50 MB/);
});

test('rejects empty files, non-images as photos, and unknown kinds', () => {
  assert.match(checkUpload({ size: 0, type: 'image/png' }, 'photo'), /empty/);
  assert.match(checkUpload({ size: 10, type: 'application/pdf' }, 'photo'), /isn't an image/);
  assert.match(checkUpload({ size: 10, type: 'text/plain' }, 'video'), /Unknown/);
});

test('photos are limited to images; files are not limited', () => {
  assert.deepEqual(allowedContentTypesFor('photo'), ['image/*']);
  assert.equal(allowedContentTypesFor('file'), null);
});

test('uploadPathname makes safe names under uploads/', () => {
  assert.equal(uploadPathname('My Photo (1).jpg'), 'uploads/My-Photo-1-.jpg');
  assert.equal(uploadPathname('../../etc/passwd'), 'uploads/etc-passwd');
  assert.equal(uploadPathname(''), 'uploads/upload');
  assert.ok(uploadPathname('x'.repeat(500) + '.png').length <= 'uploads/'.length + 100);
  assert.ok(uploadPathname('x'.repeat(500) + '.png').endsWith('.png'));
});
