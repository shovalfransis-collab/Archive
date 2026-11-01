import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { runMigrations, listMigrationFiles } = require('../scripts/migrate.js');

// A stand-in database client that just remembers what it was asked to run.
function fakeClient(alreadyRan = [], { failOn } = {}) {
  const calls = [];
  return {
    calls,
    async query(text, params) {
      calls.push(params ? [text, params] : text);
      if (failOn && text.includes(failOn)) throw new Error('boom');
      if (text.startsWith('SELECT name FROM schema_migrations')) {
        return { rows: alreadyRan.map((name) => ({ name })) };
      }
      return { rows: [] };
    },
  };
}

function tempDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-mig-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

const quiet = { log: () => {} };

test('lists only numbered .sql files, in order', () => {
  const dir = tempDir({ '010_c.sql': '', '002_b.sql': '', '001_a.sql': '', 'notes.txt': '', 'x.sql': '' });
  assert.deepEqual(listMigrationFiles(dir), ['001_a.sql', '002_b.sql', '010_c.sql']);
});

test('the real migrations folder starts with 001_init.sql', () => {
  assert.equal(listMigrationFiles()[0], '001_init.sql');
});

test('runs only the migrations that have not run yet', async () => {
  const dir = tempDir({ '001_a.sql': 'SQL A', '002_b.sql': 'SQL B' });
  const client = fakeClient(['001_a.sql']);
  const ran = await runMigrations(client, { dir, ...quiet });
  assert.deepEqual(ran, ['002_b.sql']);
  assert.ok(!client.calls.includes('SQL A'));
  assert.ok(client.calls.includes('SQL B'));
});

test('wraps each migration in a transaction and records it', async () => {
  const dir = tempDir({ '001_a.sql': 'SQL A' });
  const client = fakeClient();
  await runMigrations(client, { dir, ...quiet });
  const after = client.calls.slice(client.calls.indexOf('BEGIN'));
  assert.deepEqual(after, [
    'BEGIN',
    'SQL A',
    ['INSERT INTO schema_migrations (name) VALUES ($1)', ['001_a.sql']],
    'COMMIT',
  ]);
});

test('rolls back and stops when a migration fails', async () => {
  const dir = tempDir({ '001_a.sql': 'BAD SQL', '002_b.sql': 'SQL B' });
  const client = fakeClient([], { failOn: 'BAD SQL' });
  await assert.rejects(runMigrations(client, { dir, ...quiet }), /001_a\.sql failed/);
  assert.ok(client.calls.includes('ROLLBACK'));
  assert.ok(!client.calls.includes('SQL B'));
});
