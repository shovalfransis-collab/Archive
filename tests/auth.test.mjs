import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkPin, makeSessionToken, isValidSessionToken } from '../lib/auth.js';

beforeEach(() => {
  process.env.AUTH_SECRET = 'test-secret-that-is-long-enough';
  process.env.ARCHIVE_PIN = '4321';
});

test('checkPin accepts only the exact PIN string', () => {
  assert.equal(checkPin('4321'), true);
  assert.equal(checkPin('1234'), false);
  assert.equal(checkPin(4321), false); // a number, not a string
  assert.equal(checkPin(''), false);
  assert.equal(checkPin(undefined), false);
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
