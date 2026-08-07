import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const rootPrefix = `${root}${sep}`;
const port = Number(process.env.PORT || 4173);
const blockedRoots = new Set(['.git', '.agents', '.codex', 'node_modules', 'supabase', 'tools']);
const blockedFiles = new Set(['tatus', 'supabase-setup.md', 'admin_architecture.md', 'admin-content-model.md', 'content-todo.md', 'design_system.md', 'package.json']);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function loadLocalEnvironment() {
  const values = {};
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return values;
  readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match) return;
    values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
  return values;
}

function runtimeConfig() {
  const local = loadLocalEnvironment();
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || local.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || local.SUPABASE_ANON_KEY || '',
    publicSiteUrl: process.env.PUBLIC_SITE_URL || local.PUBLIC_SITE_URL || `http://127.0.0.1:${port}/`
  };
  return `window.PORTFOLIO_CONFIG = Object.freeze(${JSON.stringify(config)});`;
}

createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (urlPath === '/runtime-config.js') {
    const body = runtimeConfig();
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) });
    response.end(request.method === 'HEAD' ? undefined : body);
    return;
  }
  const cleanPath = urlPath.replace(/^\/+/, '');
  const relativePath = urlPath === '/' ? 'index.html' : (urlPath.endsWith('/') ? `${cleanPath}index.html` : cleanPath);
  const segments = relativePath.split(/[\\/]/);
  const firstSegment = segments[0].toLowerCase();
  const fileName = segments.at(-1).toLowerCase();
  const blocked = blockedRoots.has(firstSegment)
    || blockedFiles.has(fileName)
    || fileName.startsWith('.env')
    || fileName === 'package-lock.json'
    || extname(fileName) === '.md';
  const filePath = normalize(join(root, relativePath));

  if (blocked || (filePath !== root && !filePath.startsWith(rootPrefix)) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const size = statSync(filePath).size;
  const headers = {
    'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Accept-Ranges': 'bytes'
  };
  const range = request.headers.range && /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);

  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
      response.end();
      return;
    }
    response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, 'Content-Length': size });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Portfolio disponibile su http://127.0.0.1:${port}`);
});
