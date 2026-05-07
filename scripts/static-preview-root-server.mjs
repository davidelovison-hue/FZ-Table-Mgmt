/**
 * Serves dist/fz-table-mgmt/browser at http://127.0.0.1:4212/ (base-href / builds).
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const host = process.env.PREVIEW_HOST ?? '127.0.0.1';
const port = Number(process.env.PREVIEW_PORT ?? '4212');
const siteRoot = path.join(projectRoot, 'dist', 'fz-table-mgmt', 'browser');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function safeResolve(urlPathname) {
  const decoded = decodeURIComponent(urlPathname.split('?')[0]);
  let relative = decoded === '/' ? 'index.html' : decoded.slice(1);
  if (relative.endsWith('/')) {
    relative += 'index.html';
  }
  const candidate = path.normalize(path.join(siteRoot, relative));
  if (!candidate.startsWith(siteRoot)) {
    return null;
  }
  return candidate;
}

async function tryRead(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return null;
    }
    return fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${host}`);
  let filePath = safeResolve(url.pathname);

  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let body = await tryRead(filePath);
  if (!body) {
    body = await tryRead(path.join(siteRoot, 'index.html'));
    filePath = path.join(siteRoot, 'index.html');
  }

  if (!body) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const type = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

http
  .createServer(handler)
  .listen(port, host, async () => {
    try {
      await fs.access(siteRoot);
    } catch {
      console.error(`Missing ${siteRoot}. Run npm run build:preview:root first.`);
      process.exit(1);
    }
    console.log('');
    console.log(`Static preview (base-href /): http://${host}:${port}/`);
    console.log('');
  })
  .on('error', (err) => {
    console.error(err.message);
    process.exit(1);
  });
