/**
 * Copy index.html → 404.html for GitHub Pages SPA fallback (works on Windows/macOS/Linux).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const browser = join(process.cwd(), 'dist', 'fz-table-mgmt', 'browser');
const indexHtml = join(browser, 'index.html');
const notFoundHtml = join(browser, '404.html');

if (!existsSync(indexHtml)) {
  console.error(`Missing ${indexHtml}; run ng build first.`);
  process.exit(1);
}
copyFileSync(indexHtml, notFoundHtml);
console.log(`Wrote ${notFoundHtml}`);
