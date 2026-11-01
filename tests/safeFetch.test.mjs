import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import zlib from 'node:zlib';
import { isPublicAddress, checkFetchableUrl, fetchPublicPage } from '../lib/safeFetch.js';

test('isPublicAddress blocks private, local and special addresses', () => {
  for (const ip of [
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255',
    '::1', '::', 'fe80::1', 'fd12:3456::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '64:ff9b::a9fe:a9fe',
    'not-an-ip', '',
  ]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('isPublicAddress allows ordinary public addresses', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700::1111', '::ffff:8.8.8.8']) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
});

test('checkFetchableUrl only allows plain http(s) links on standard ports', () => {
  assert.equal(checkFetchableUrl('https://example.com/a').hostname, 'example.com');
  assert.ok(checkFetchableUrl('http://example.com:80/'));
  for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'ftp://x.com', 'not a url',
                     'http://example.com:8080/', 'https://user:pass@example.com/']) {
    assert.throws(() => checkFetchableUrl(bad), undefined, bad);
  }
});

// ---- Against a real local server --------------------------------------
// The server runs on 127.0.0.1 — exactly the kind of address that must be
// refused. Tests that need to reach it pass a stand-in `_isAllowedAddress`.

let server;
let base;
const allowLocal = () => true;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/page') {
      res.setHeader('content-type', 'text/html');
      res.end('<title>Hello</title>');
    } else if (req.url === '/big') {
      res.setHeader('content-type', 'text/html');
      res.end('<title>Big</title>' + 'x'.repeat(2_000_000));
    } else if (req.url === '/gzip') {
      res.setHeader('content-encoding', 'gzip');
      res.end(zlib.gzipSync('<title>Zipped</title>'));
    } else if (req.url === '/to-page') {
      res.writeHead(302, { location: '/page' });
      res.end();
    } else if (req.url === '/to-metadata') {
      res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' });
      res.end();
    } else if (req.url === '/loop') {
      res.writeHead(302, { location: '/loop' });
      res.end();
    } else if (req.url === '/slow') {
      setTimeout(() => res.end('late'), 2000);
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

// Lets the tests reach the local server (random port, private address).
const local = { _testing: { isAllowedAddress: () => true, allowAnyPort: true } };
// Only the port rule relaxed — the address rule is the real one.
const portOnly = { _testing: { allowAnyPort: true } };

test('refuses to fetch localhost, by IP or by name', async () => {
  await assert.rejects(fetchPublicPage(`${base}/page`, portOnly), /private network/);
  await assert.rejects(fetchPublicPage('http://localhost/'), /private network/);
  await assert.rejects(fetchPublicPage('http://[::1]/'), /private network/);
  await assert.rejects(fetchPublicPage('http://169.254.169.254/latest/meta-data/'), /private network/);
});

test('refuses non-standard ports and bad schemes in normal use', async () => {
  await assert.rejects(fetchPublicPage(`${base}/page`), /standard web ports/);
  await assert.rejects(fetchPublicPage('file:///etc/passwd'), /http/);
});

test('fetches a page', async () => {
  const r = await fetchPublicPage(`${base}/page`, local);
  assert.equal(r.status, 200);
  assert.equal(r.body, '<title>Hello</title>');
});

test('decompresses gzip', async () => {
  assert.equal((await fetchPublicPage(`${base}/gzip`, local)).body, '<title>Zipped</title>');
});

test('stops reading at the size limit', async () => {
  const r = await fetchPublicPage(`${base}/big`, { ...local, maxBytes: 1000 });
  assert.equal(r.body.length, 1000);
  assert.ok(r.body.startsWith('<title>Big</title>'));
});

test('follows a safe redirect and reports the final URL', async () => {
  const r = await fetchPublicPage(`${base}/to-page`, local);
  assert.equal(r.body, '<title>Hello</title>');
  assert.ok(r.url.endsWith('/page'));
});

test('re-checks the target of a redirect', async () => {
  // Allow our test server, but nothing else private.
  const onlyTestServer = { _testing: { isAllowedAddress: (ip) => ip === '127.0.0.1', allowAnyPort: true } };
  await assert.rejects(fetchPublicPage(`${base}/to-metadata`, onlyTestServer), /private network/);
});

test('gives up on redirect loops', async () => {
  await assert.rejects(fetchPublicPage(`${base}/loop`, local), /Too many redirects/);
});

test('gives up after the timeout', async () => {
  await assert.rejects(fetchPublicPage(`${base}/slow`, { ...local, timeoutMs: 300 }), /abort|timeout/i);
});
