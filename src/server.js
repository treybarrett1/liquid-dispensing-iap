import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { DomainError, RunHistory } from './run-history.js';
import { SqliteHistory } from './sqlite-history.js';

const directory = dirname(fileURLToPath(import.meta.url));
const database = resolve(process.env.IAP_DB_PATH || 'data/dispenser.sqlite');
const port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer from 0 to 65535');
const store = new SqliteHistory(database);
const history = new RunHistory(store);
const instanceId = randomUUID();
let recoveredCount = 0;
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function body(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (Buffer.byteLength(text) > 2048) throw new DomainError('Request is too large.', 413);
  }
  try { return JSON.parse(text); } catch { throw new DomainError('Request must contain valid JSON.'); }
}

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  const expectedHost = `127.0.0.1:${server.address().port}`;
  if (request.headers.host !== expectedHost && request.headers.host !== `localhost:${server.address().port}`) {
    return json(response, 403, { error: 'Use the local address printed by the server.' });
  }
  try {
    const url = new URL(request.url, `http://${expectedHost}`);
    if (request.method === 'POST') {
      const origin = request.headers.origin;
      if (origin && origin !== `http://${request.headers.host}`) throw new DomainError('Origin is not allowed.', 403);
      if (!request.headers['content-type']?.startsWith('application/json')) throw new DomainError('Use application/json.', 415);
    }
    if (request.method === 'GET' && url.pathname === '/api/runs') return json(response, 200, { runs: history.list() });
    if (request.method === 'GET' && url.pathname === '/api/status') {
      return json(response, 200, { instanceId, recoveredCount, storage: 'SQLite file', mode: 'Record lifecycle only; no pump or sensor control' });
    }
    if (request.method === 'POST' && url.pathname === '/api/runs') return json(response, 201, history.create(await body(request)));
    const cancel = url.pathname.match(/^\/api\/runs\/([0-9a-f-]{36})\/cancel$/);
    if (request.method === 'POST' && cancel) return json(response, 200, history.cancel(cancel[1]));
    if (request.method === 'GET' && files[url.pathname]) {
      const [filename, type] = files[url.pathname];
      const content = await readFile(resolve(directory, 'public', filename));
      response.writeHead(200, { 'Content-Type': type });
      return response.end(content);
    }
    json(response, 404, { error: 'Not found.' });
  } catch (error) {
    if (!(error instanceof DomainError)) console.error(error);
    json(response, error instanceof DomainError ? error.status : 500,
      { error: error instanceof DomainError ? error.message : 'Storage or server operation failed. The request was not reported as successful.' });
  }
});

server.once('error', (error) => { console.error(error); store.close(); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  try {
    recoveredCount = history.recover();
    console.log(JSON.stringify({ event: 'ready', url: `http://127.0.0.1:${server.address().port}`, database, instanceId, recoveredCount }));
  } catch (error) {
    console.error(error);
    server.close(() => { store.close(); process.exitCode = 1; });
  }
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { store.close(); process.exit(0); }));
}
