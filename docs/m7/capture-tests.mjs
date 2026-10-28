import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { platform, release } from 'node:os';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Usage: node docs/m7/capture-tests.mjs before|after');
if (process.versions.node.split('.')[0] !== '24') throw new Error('Node.js 24 is required.');
const output = `docs/m7/${phase}-tests.txt`;
if (existsSync(output)) throw new Error(`Preserve existing evidence before rerunning: ${output}`);
const git = (...args) => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(path) : [path];
  });
}
const inputs = [...files('test'), ...files('scripts'), 'package.json', 'package-lock.json', 'playwright.config.js'].sort();
const hashes = () => Object.fromEntries(inputs.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
const initialHashes = hashes();
const initialDiff = git('diff', 'HEAD', '--', 'src', 'test', 'scripts', 'web', 'package.json', 'package-lock.json', 'playwright.config.js');
if (initialDiff) throw new Error('Tracked runtime or test inputs differ from HEAD.');
writeFileSync(output, `M7 ${phase} verification\nUTC start: ${new Date().toISOString()}\nRepository: https://github.com/treybarrett1/liquid-dispensing-iap\nRevision: ${git('rev-parse', 'HEAD')}\nBranch: ${git('rev-parse', '--abbrev-ref', 'HEAD')}\nWorking directory: ${process.cwd()}\nNode: ${process.version}\nNode executable: ${process.execPath}\nOS: ${platform()} ${release()} (${process.arch})\nTracked runtime and test inputs match HEAD.\n\nInput SHA-256 hashes:\n${JSON.stringify(initialHashes, null, 2)}\n`, 'utf8');
const record = text => { appendFileSync(output, text, 'utf8'); process.stdout.write(text); };
const env = { ...process.env, NO_COLOR: '1' };
delete env.FORCE_COLOR;
const commands = ['npm --version', 'npm ci', 'npm run build', 'npm test', 'npm run test:m6'];
const results = [];
for (const command of commands) {
  record(`\n$ ${command}\nUTC start: ${new Date().toISOString()}\n`);
  const started = Date.now();
  const result = platform() === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], { encoding: 'utf8', env, maxBuffer: 20 * 1024 * 1024 })
    : spawnSync('sh', ['-c', command], { encoding: 'utf8', env, maxBuffer: 20 * 1024 * 1024 });
  record(`--- stdout ---\n${result.stdout || ''}\n--- stderr ---\n${result.stderr || ''}`);
  if (result.error) record(`\nExecution error: ${result.error.message}\n`);
  record(`\nExit code: ${result.status}; signal: ${result.signal || 'none'}; elapsed: ${Date.now() - started} ms\n`);
  results.push({ command, exitCode: result.status });
}
const unchanged = JSON.stringify(initialHashes) === JSON.stringify(hashes());
record(`\nInputs unchanged during execution: ${unchanged}\nCommand results: ${JSON.stringify(results)}\nUTC finish: ${new Date().toISOString()}\n`);
process.exitCode = unchanged && results.every(result => result.exitCode === 0) ? 0 : 1;
