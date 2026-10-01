import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

async function launch(database, port = 0) {
  const child = spawn(process.execPath, [resolve('dist/server.js')], {
    env: { ...process.env, PORT: String(port), IAP_DB_PATH: database }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '', errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  const ready = await new Promise((accept, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`Startup timed out: ${errors}`)); }, 15000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`Startup exited ${code}: ${errors}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      for (const line of output.split('\n')) {
        try {
          const entry = JSON.parse(line);
          if (entry.event === 'ready') { clearTimeout(timer); accept(entry); return; }
        } catch { /* Wait for a complete JSON line. */ }
      }
    });
  });
  return { child, ...ready };
}

async function kill(server) {
  if (!server || server.child.exitCode !== null || server.child.signalCode !== null) return;
  await new Promise(resolve => { server.child.once('exit', resolve); server.child.kill('SIGKILL'); });
}

test('browser -> HTTP -> domain -> SQLite -> restart recovery -> browser', async ({ page }, testInfo) => {
  const directory = await mkdtemp(join(tmpdir(), 'iap-e2e-'));
  const filename = join(directory, 'evidence.sqlite');
  let server;
  try {
    server = await launch(filename);
    const firstInstance = server.instanceId;
    await page.goto(server.url);
    await expect(page.getByText('No saved records yet.')).toBeVisible();
    await page.getByLabel('Target volume').fill('120.5');
    await page.getByLabel('Usable bottle capacity').fill('150');
    await page.getByRole('button', { name: 'Save pending record' }).click();
    await expect(page.getByRole('status')).toContainText('committed to SQLite');
    const pending = page.locator('.run');
    await expect(pending).toHaveCount(1);
    await expect(pending.locator('.badge')).toHaveText('Pending');
    const runId = await pending.getAttribute('data-run-id');
    const reader = new DatabaseSync(filename, { readOnly: true });
    const diskBefore = reader.prepare('SELECT run_id, target_ml, capacity_ml, status FROM runs').get();
    reader.close();
    expect(diskBefore).toEqual({ run_id: runId, target_ml: 120.5, capacity_ml: 150, status: 'Pending' });
    await page.screenshot({ path: testInfo.outputPath('01-pending-saved.png'), fullPage: true });
    await page.reload();
    await expect(page.locator('.run')).toHaveAttribute('data-run-id', runId);
    await expect(page.locator('.badge')).toHaveText('Pending');

    const port = Number(new URL(server.url).port);
    await kill(server); // Actual process termination, not an API pretending to restart.
    server = await launch(filename, port);
    expect(server.instanceId).not.toBe(firstInstance);
    expect(server.recoveredCount).toBe(1);
    await page.reload();
    await expect(page.locator('.run')).toHaveCount(1);
    await expect(page.locator('.run')).toHaveAttribute('data-run-id', runId);
    await expect(page.locator('.badge')).toHaveText('Failed');
    await expect(page.locator('.run')).toContainText('interrupted');
    await expect(page.locator('.run')).toContainText('120.5 mL target');
    await page.screenshot({ path: testInfo.outputPath('02-recovered-after-restart.png'), fullPage: true });
    const readerAfter = new DatabaseSync(filename, { readOnly: true });
    const diskAfter = readerAfter.prepare('SELECT run_id, target_ml, capacity_ml, status, reason FROM runs').get();
    readerAfter.close();
    expect(diskAfter).toEqual({ ...diskBefore, status: 'Failed', reason: 'interrupted' });
    const recoveredInstance = server.instanceId;
    await kill(server);
    server = await launch(filename, port);
    expect(server.recoveredCount).toBe(0);
    await page.reload();
    await expect(page.locator('.run')).toHaveCount(1);
    await expect(page.locator('.badge')).toHaveText('Failed');

    await page.getByLabel('Target volume').fill('200');
    await page.getByLabel('Usable bottle capacity').fill('150');
    await page.getByRole('button', { name: 'Save pending record' }).click();
    await expect(page.getByRole('status')).toContainText('exceeds usable bottle capacity');
    await expect(page.locator('.run')).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath('03-invalid-target-rejected.png'), fullPage: true });
    await page.getByLabel('Target volume').fill('60');
    await page.getByRole('button', { name: 'Save pending record' }).click();
    await expect(page.getByRole('status')).toContainText('committed to SQLite');
    await page.getByRole('button', { name: 'Cancel record' }).click();
    await expect(page.getByRole('status')).toContainText('Cancellation committed');
    await page.reload();
    await expect(page.locator('.run')).toHaveCount(2);
    await expect(page.locator('.badge').first()).toHaveText('Cancelled');
    await page.screenshot({ path: testInfo.outputPath('04-cancellation-persisted.png'), fullPage: true });
    await writeFile(testInfo.outputPath('evidence.json'), JSON.stringify({
      capturedAt: new Date().toISOString(), runId, diskBefore, diskAfter,
      firstInstance, recoveredInstance, secondRestartInstance: server.instanceId,
      assertions: ['real SQLite query before and after process termination', 'same run ID recovered',
        'new server instance', 'second recovery produced no duplicate', 'over-capacity rejected', 'cancellation survived page reload'],
    }, null, 2) + '\n');
    for (const name of ['01-pending-saved.png', '02-recovered-after-restart.png', '03-invalid-target-rejected.png', '04-cancellation-persisted.png', 'evidence.json']) {
      await testInfo.attach(name, { path: testInfo.outputPath(name), contentType: name.endsWith('.png') ? 'image/png' : 'application/json' });
    }
  } finally { await kill(server); await rm(directory, { recursive: true, force: true }); }
});

test('HTTP rejects malformed and cross-origin writes without saved records', async ({ request }) => {
  const directory = await mkdtemp(join(tmpdir(), 'iap-api-'));
  let server;
  try {
    server = await launch(join(directory, 'api.sqlite'));
    const malformed = await request.post(`${server.url}/api/runs`, { headers: { 'Content-Type': 'application/json' }, data: '{' });
    expect(malformed.status()).toBe(400);
    const external = await request.post(`${server.url}/api/runs`, {
      headers: { Origin: 'https://example.org' }, data: { targetMl: 30, usableCapacityMl: 50 },
    });
    expect(external.status()).toBe(403);
    expect(await (await request.get(`${server.url}/api/runs`)).json()).toEqual({ runs: [] });
  } finally { await kill(server); await rm(directory, { recursive: true, force: true }); }
});
