import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';

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

const localEnvironment = loadLocalEnvironment();
Object.entries(localEnvironment).forEach(([key, value]) => { if (!process.env[key]) process.env[key] = value; });
const require = createRequire(import.meta.url);
const replyMessageHandler = require('../api/reply-message.js');

function runtimeConfig() {
  const local = loadLocalEnvironment();
  const config = {
    supabaseUrl: local.SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: local.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    publicSiteUrl: process.env.PUBLIC_SITE_URL || local.PUBLIC_SITE_URL || `http://127.0.0.1:${port}/`
  };
  return `window.PORTFOLIO_CONFIG = Object.freeze(${JSON.stringify(config)});`;
}

createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (urlPath === '/api/reply-message') {
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 32768) { response.writeHead(413); response.end(); return; }
    }
    try { request.body = body ? JSON.parse(body) : {}; } catch (error) { response.writeHead(400); response.end('{"error":"JSON non valido"}'); return; }
    await replyMessageHandler(request, response);
    return;
  }
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
