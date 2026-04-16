import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

// Auto-increment filename
let n = 1;
while (existsSync(join(outDir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const outFile = join(outDir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });

// Scroll through page to trigger IntersectionObserver reveal animations
await page.evaluate(async () => {
  await new Promise(resolve => {
    const distance = 300;
    const delay = 80;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, delay);
  });
});
await new Promise(r => setTimeout(r, 800)); // let final animations settle

const buf = await page.screenshot({ fullPage: true });
await writeFile(outFile, buf);
await browser.close();

console.log(`Saved: ${outFile}`);
