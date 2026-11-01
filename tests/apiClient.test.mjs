import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from '../lib/apiClient.js';
import { showToast, showError, subscribeToToasts } from '../lib/toast.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
const respond = (status, body) => {
  globalThis.fetch = async (url, init) => {
    respond.last = { url, init };
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  };
};

test('returns the JSON body on success and sends JSON', async () => {
  respond(200, { id: 1 });
  assert.deepEqual(await apiRequest('/api/x', { method: 'PATCH', body: { a: 1 } }), { id: 1 });
  assert.equal(respond.last.init.method, 'PATCH');
  assert.equal(respond.last.init.body, '{"a":1}');
  assert.equal(respond.last.init.headers['Content-Type'], 'application/json');
});

test('uses the server error message', async () => {
  respond(400, { error: 'Folder name can’t be empty.' });
  await assert.rejects(apiRequest('/api/x'), /Folder name can’t be empty/);
});

test('explains being logged out', async () => {
  respond(401, { error: 'whatever' });
  await assert.rejects(apiRequest('/api/x'), /logged out/);
});

test('handles non-JSON error pages', async () => {
  respond(500, '<html>oops</html>');
  await assert.rejects(apiRequest('/api/x'), /error 500/);
});

test('handles no connection', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(apiRequest('/api/x'), /reach the server/);
});

test('toasts reach subscribers, errors last longer, unsubscribe works', () => {
  const seen = [];
  const stop = subscribeToToasts((t) => seen.push(t));
  showToast('Saved');
  showError('Nope');
  stop();
  showToast('Not seen');
  assert.deepEqual(seen.map((t) => [t.message, t.type]), [['Saved', 'info'], ['Nope', 'error']]);
  assert.ok(seen[1].duration > seen[0].duration);
});
