import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist/public', { recursive: true });
await build({ entryPoints: ['src/server.js'], outfile: 'dist/server.js', bundle: true, platform: 'node', target: 'node24', format: 'esm' });
await build({ entryPoints: ['web/app.js'], outfile: 'dist/public/app.js', bundle: true, platform: 'browser', target: 'es2022', format: 'esm' });
await copyFile('web/index.html', 'dist/public/index.html');
await copyFile('web/style.css', 'dist/public/style.css');
console.log('Built production server and browser assets in dist/.');
