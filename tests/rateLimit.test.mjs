import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientKey, lockedMessage, wrongPinMessage, MAX_FAILURES } from '../lib/rateLimit.js';

const h = (obj) => new Headers(obj);

test('clientKey uses x-real-ip, then the first x-forwarded-for address', () => {
  assert.equal(clientKey(h({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' })), '1.2.3.4');
  assert.equal(clientKey(h({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' })), '5.6.7.8');
  assert.equal(clientKey(h({})), 'unknown');
});

test('clientKey groups IPv6 addresses by their /64 block', () => {
  const a = clientKey(h({ 'x-real-ip': '2001:db8:abcd:12:1111:2222:3333:4444' }));
  const b = clientKey(h({ 'x-real-ip': '2001:0db8:abcd:0012::9' }));
  assert.equal(a, '2001:db8:abcd:12::/64');
  assert.equal(a, b);
  assert.notEqual(a, clientKey(h({ 'x-real-ip': '2001:db8:abcd:13::1' })));
  assert.equal(clientKey(h({ 'x-real-ip': '::1' })), '0:0:0:0::/64');
  assert.equal(clientKey(h({ 'x-real-ip': 'fe80::1%eth0' })), 'fe80:0:0:0::/64');
});

test('lockedMessage rounds up to whole minutes', () => {
  const now = new Date('2026-01-01T10:00:00Z');
  assert.equal(lockedMessage(new Date('2026-01-01T10:14:10Z'), now), 'Too many wrong PINs. Try again in 15 minutes.');
  assert.equal(lockedMessage(new Date('2026-01-01T10:00:20Z'), now), 'Too many wrong PINs. Try again in 1 minute.');
});

test('wrongPinMessage warns as the limit gets close', () => {
  assert.equal(wrongPinMessage(1), 'Wrong PIN — try again.');
  assert.match(wrongPinMessage(MAX_FAILURES - 2), /2 tries left/);
  assert.match(wrongPinMessage(MAX_FAILURES - 1), /1 try left/);
});
