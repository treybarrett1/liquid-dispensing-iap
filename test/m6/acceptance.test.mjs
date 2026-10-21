/** Real HTTP -> domain -> SQLite acceptance, using the built M5 server. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

async function launch(filename) {
  const child = spawn(process.execPath, [resolve('dist/server.js')], {
    env: { ...process.env, IAP_DB_PATH: filename, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const ready = await new Promise((success, failure) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      failure(new Error(`Server startup timed out: ${stderr}`));
    }, 12000);
    child.once('error', error => { clearTimeout(timer); failure(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      failure(new Error(`Server exited during startup ${code}: ${stderr}`));
    });
    child.stdout.on('data', chunk => {
      stdout += chunk;
      for (const line of stdout.split('\n')) {
        try {
          const entry = JSON.parse(line);
          if (entry.event === 'ready') {
            clearTimeout(timer);
            success({ child, ...entry });
            return;
          }
        } catch { /* Ignore incomplete output. */ }
      }
    });
  });
  return ready;
}

async function terminate(server) {
  if (!server || server.child.exitCode !== null || server.child.signalCode !== null) return;
  await new Promise(resolveExit => {
    server.child.once('exit', resolveExit);
    server.child.kill('SIGKILL');
  });
}

function readRows(filename) {
  const reader = new DatabaseSync(filename, { readOnly: true });
  try {
    return reader.prepare(
      'SELECT run_id, target_ml, capacity_ml, status, reason FROM runs ORDER BY sequence',
    ).all();
  } finally {
    reader.close();
  }
}

test('M5 HTTP boundary accepts exact-capacity target and persists it; rejects overflow', {
  timeout: 30000,
}, async () => {
  const folder = mkdtempSync(join(tmpdir(), 'iap-m6-acceptance-'));
  const filename = join(folder, 'run.sqlite');
  let server;
  try {
    server = await launch(filename);
    const created = await fetch(`${server.url}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMl: 120, usableCapacityMl: 120 }),
    });
    assert.equal(created.status, 201, 'Exactly-full valid bottle must be accepted.');
    const record = await created.json();
    assert.equal(record.status, 'Pending');
    assert.equal(record.targetMl, 120);
    assert.equal(record.usableCapacityMl, 120);
    assert.deepEqual(readRows(filename), [{
      run_id: record.runId, target_ml: 120, capacity_ml: 120,
      status: 'Pending', reason: null,
    }]);

    const tooMuch = await fetch(`${server.url}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMl: 120.01, usableCapacityMl: 120 }),
    });
    assert.equal(tooMuch.status, 400);
    assert.match((await tooMuch.json()).error, /exceeds usable bottle capacity/);
    assert.equal(readRows(filename).length, 1, 'Rejected request cannot insert a row.');

    const listing = await (await fetch(`${server.url}/api/runs`)).json();
    assert.equal(listing.runs.length, 1);
    assert.equal(listing.runs[0].runId, record.runId);

    const cancelled = await fetch(`${server.url}/api/runs/${record.runId}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(cancelled.status, 200);
    assert.equal((await cancelled.json()).status, 'Cancelled');
    assert.equal(readRows(filename)[0].status, 'Cancelled');
  } finally {
    await terminate(server);
    rmSync(folder, { recursive: true, force: true });
  }
});

test('M5 real process restart recovers one pending SQLite record without duplicates', {
  timeout: 30000,
}, async () => {
  const folder = mkdtempSync(join(tmpdir(), 'iap-m6-recovery-'));
  const filename = join(folder, 'run.sqlite');
  let server;
  try {
    server = await launch(filename);
    const created = await fetch(`${server.url}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMl: 120.5, usableCapacityMl: 150 }),
    });
    assert.equal(created.status, 201);
    const { runId } = await created.json();
    const oldInstanceId = server.instanceId;
    await terminate(server);
    server = await launch(filename);
    assert.notEqual(server.instanceId, oldInstanceId);
    assert.equal(server.recoveredCount, 1);
    assert.deepEqual(readRows(filename), [{
      run_id: runId, target_ml: 120.5, capacity_ml: 150,
      status: 'Failed', reason: 'interrupted',
    }]);
    await terminate(server);
    server = await launch(filename);
    assert.equal(server.recoveredCount, 0);
    assert.equal(readRows(filename).length, 1);
  } finally {
    await terminate(server);
    rmSync(folder, { recursive: true, force: true });
  }
});
