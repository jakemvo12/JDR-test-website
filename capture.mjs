/**
 * capture.mjs — Screenshot any website for use as a reference image
 *
 * Usage:
 *   node capture.mjs https://example.com
 *   node capture.mjs https://example.com my-label
 *
 * Saves to: ./reference screenshots/
 */

import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'reference screenshots');

const url   = process.argv[2];
const label = process.argv[3] || '';

if (!url) {
  console.error('Usage: node capture.mjs <url> [label]');
  process.exit(1);
}

if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

// Auto-increment filename
let n = 1;
while (existsSync(join(outDir, `ref-${n}${label ? '-' + label : ''}.png`))) n++;
const outFile = join(outDir, `ref-${n}${label ? '-' + label : ''}.png`);

console.log(`Capturing ${url} ...`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll to trigger lazy-loaded content
await page.evaluate(async () => {
  await new Promise(resolve => {
    const timer = setInterval(() => {
      window.scrollBy(0, 400);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 100);
  });
});
await new Promise(r => setTimeout(r, 800));

const buf = await page.screenshot({ fullPage: true });
await writeFile(outFile, buf);
await browser.close();

console.log(`Saved: ${outFile}`);
