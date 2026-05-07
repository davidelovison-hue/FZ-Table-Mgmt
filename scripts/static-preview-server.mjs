/**
 * Minimal static server for post-build preview (no http-server dependency).
 * Serves `.gh-preview/` so URLs match GitHub Pages (repo slug is case-sensitive).
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const host = process.env.PREVIEW_HOST ?? '127.0.0.1';
const port = Number(process.env.PREVIEW_PORT ?? '4211');
const urlPrefix = '/FZ-Table-Mgmt';
const siteRoot = path.join(projectRoot, '.gh-preview', 'FZ-Table-Mgmt');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function safeResolve(relUrlPath) {
  const decoded = decodeURIComponent(relUrlPath.split('?')[0]);
  const relative = decoded.startsWith('/') ? decoded.slice(1) : decoded;
  const candidate = path.normalize(path.join(siteRoot, relative));
  if (!candidate.startsWith(siteRoot)) {
    return null;
  }
  return candidate;
}

async function tryFile(filePath) {
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

  if (!url.pathname.startsWith(urlPrefix + '/') && url.pathname !== urlPrefix) {
    res.writeHead(302, { Location: `${urlPrefix}/` });
    res.end();
    return;
  }

  let subPath = url.pathname.slice(urlPrefix.length);
  if (subPath === '' || subPath === '/') {
    subPath = '/index.html';
  }

  let filePath = safeResolve(subPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let body = await tryFile(filePath);

  if (!body && subPath.endsWith('/')) {
    filePath = safeResolve(subPath + 'index.html');
    body = filePath ? await tryFile(filePath) : null;
  }

  if (!body) {
    body = await tryFile(path.join(siteRoot, 'index.html'));
    if (!body) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    filePath = path.join(siteRoot, 'index.html');
  }

  const ext = path.extname(filePath);
  const type = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

const server = http.createServer(handler);

server.listen(port, host, async () => {
  try {
    await fs.access(siteRoot);
  } catch {
    console.error(`Missing folder ${siteRoot}. Run: npm run build:gh-pages && node scripts/preview-gh-pages-setup.mjs`);
    process.exit(1);
  }
  console.log('');
  console.log(`Static preview (production build):`);
  console.log(`  http://${host}:${port}${urlPrefix}/ (same path casing as GitHub Pages)`);
  console.log('');
});

server.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});
