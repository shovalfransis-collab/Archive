import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkPin, safeEqual, makeSessionToken, isValidSessionToken } from '../lib/auth.js';

beforeEach(() => {
  process.env.AUTH_SECRET = 'test-secret-that-is-long-enough';
  process.env.ARCHIVE_PIN = '4321';
});

test('checkPin accepts only the exact PIN string', async () => {
  assert.equal(await checkPin('4321'), true);
  assert.equal(await checkPin('1234'), false);
  assert.equal(await checkPin('43210'), false);
  assert.equal(await checkPin(4321), false); // a number, not a string
  assert.equal(await checkPin(''), false);
  assert.equal(await checkPin(undefined), false);
});

test('safeEqual compares strings exactly', async () => {
  assert.equal(await safeEqual('abc', 'abc'), true);
  assert.equal(await safeEqual('abc', 'abd'), false);
  assert.equal(await safeEqual('abc', 'abcd'), false);
  assert.equal(await safeEqual('', ''), true);
  assert.equal(await safeEqual('a', undefined), false);
});

test('a freshly made session token is valid', async () => {
  const token = await makeSessionToken();
  assert.equal(await isValidSessionToken(token), true);
});

test('a tampered token is rejected', async () => {
  const token = await makeSessionToken();
  const [value, signature] = token.split('.');
  const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
  assert.equal(await isValidSessionToken(`${value}.${flipped}`), false);
  assert.equal(await isValidSessionToken(`other.${signature}`), false);
});

test('empty or malformed tokens are rejected', async () => {
  assert.equal(await isValidSessionToken(undefined), false);
  assert.equal(await isValidSessionToken(''), false);
  assert.equal(await isValidSessionToken('no-dot-here'), false);
  assert.equal(await isValidSessionToken('.'), false);
});

test('changing the PIN logs out old sessions', async () => {
  const token = await makeSessionToken();
  process.env.ARCHIVE_PIN = '9999';
  assert.equal(await isValidSessionToken(token), false);
});

import { makeShareKey, isValidShareKey } from '../lib/auth.js';

test('the share key is stable and checks out', async () => {
  const key = await makeShareKey();
  assert.equal(key.length, 32);
  assert.equal(key, await makeShareKey());
  assert.equal(await isValidShareKey(key), true);
});

test('wrong, missing, or old share keys are rejected', async () => {
  const key = await makeShareKey();
  assert.equal(await isValidShareKey(undefined), false);
  assert.equal(await isValidShareKey(''), false);
  assert.equal(await isValidShareKey('x'.repeat(32)), false);
  process.env.ARCHIVE_PIN = '0000';
  assert.equal(await isValidShareKey(key), false);
});
