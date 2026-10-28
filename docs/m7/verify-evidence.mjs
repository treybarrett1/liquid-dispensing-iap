import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const before = '05a1b79a80f189ebf49f12e313406ce18618f32e';
const after = 'fa0a51d0fdbda5a6f39983ad7956a17cb93a2ec6';
const git = (...args) => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const logs = ['before', 'after'].map(phase => readFileSync(`docs/m7/${phase}-tests.txt`, 'utf8'));
const expectedCommands = ['npm --version', 'npm ci', 'npm run build', 'npm test', 'npm run test:m6'];
for (const [index, log] of logs.entries()) {
  assert.ok(log.includes(`Revision: ${index === 0 ? before : after}`));
  assert.ok(log.includes('Node: v24.18.0'));
  assert.ok(log.includes('Inputs unchanged during execution: true'));
  const results = JSON.parse(log.match(/^Command results: (.+)$/m)[1]);
  assert.deepEqual(results.map(result => result.command), expectedCommands);
  assert.ok(results.every(result => result.exitCode === 0));
  assert.match(log, /Tests\s+23 passed \(23\)/);
  for (const [key, value] of Object.entries({ tests: 27, pass: 27, fail: 0, cancelled: 0, skipped: 0, todo: 0 })) {
    assert.match(log, new RegExp(`^.* ${key} ${value}$`, 'm'));
  }
}
const hashes = logs.map(log => JSON.parse(log.match(/Input SHA-256 hashes:\n(\{[\s\S]*?\n\})/)[1]));
assert.deepEqual(hashes[0], hashes[1]);
const m6Names = logs.map(log => [...log.matchAll(/^✔ (.+) \([\d.]+ms\)$/gm)].map(match => match[1]).sort());
assert.equal(m6Names[0].length, 27);
assert.deepEqual(m6Names[0], m6Names[1]);
const vitestFiles = logs.map(log => [...log.matchAll(/^ ✓ (test\/.+? \(\d+ tests\))/gm)].map(match => match[1]).sort());
assert.equal(vitestFiles[0].length, 2);
assert.deepEqual(vitestFiles[0], vitestFiles[1]);
assert.equal(git('merge-base', before, after).trim(), before);
const stablePaths = ['test', 'scripts', 'web', 'package.json', 'package-lock.json', 'playwright.config.js', '.github'];
assert.equal(git('diff', before, after, '--', ...stablePaths), '');
assert.equal(git('diff', before, '--', ...stablePaths), '');
assert.equal(git('diff', after, '--', 'src'), '');
assert.equal(git('diff', '--name-only', before, after, '--', 'src').trim(), 'src/run-history.js');
const diff = git('diff', '--no-ext-diff', '--no-color', '--binary', before, after, '--', 'src/run-history.js');
const revisionDiff = git('diff', '--no-ext-diff', '--no-color', '--binary', before, after);
assert.equal(readFileSync('docs/m7/before-after.diff', 'utf8'), diff);
assert.equal(readFileSync('docs/m7/tested-revisions.diff', 'utf8'), revisionDiff);
const report = `M7 evidence consistency verification\nUTC: ${new Date().toISOString()}\nBefore: ${before}\nAfter: ${after}\nPASS: original main is the merge base of the tested refactor.\nPASS: Node.js v24.18.0 and all four requested commands succeeded on both revisions.\nPASS: both logs report 23/23 Vitest and 27/27 M6 tests; M6 has zero failures, skips, cancellations, or todos.\nPASS: same two Vitest files/test counts and all 27 M6 test names.\nPASS: all nine recorded input SHA-256 hashes match between runs and remained unchanged during each run.\nPASS: test/, scripts/, web/, package files, Playwright config, and workflows are unchanged from original main.\nPASS: current src/ matches tested refactor; src/run-history.js is the only changed runtime file.\nPASS: saved source diff and complete tested-revision diff exactly match git diff.\n`;
writeFileSync('docs/m7/verification.txt', report, 'utf8');
process.stdout.write(report);
