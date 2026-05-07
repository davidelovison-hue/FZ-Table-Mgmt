/**
 * Mirrors GitHub Pages URL layout locally: .gh-preview/fz-table-mgmt/<browser assets>
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const src = join(root, 'dist', 'fz-table-mgmt', 'browser');
const destRoot = join(root, '.gh-preview', 'fz-table-mgmt');

if (!existsSync(join(src, 'index.html'))) {
  console.error(`Missing ${src}/index.html; run npm run build:gh-pages first.`);
  process.exit(1);
}

rmSync(join(root, '.gh-preview'), { recursive: true, force: true });
mkdirSync(destRoot, { recursive: true });
cpSync(src, destRoot, { recursive: true });

console.log('');
console.log('Open http://127.0.0.1:4211/fz-table-mgmt/ (same path as GitHub Pages)');
console.log('');
