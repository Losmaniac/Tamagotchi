// Renders public/icons/icon.svg to the PNG sizes the manifest and iOS need.
// Uses Playwright's Chromium (already a dev dependency), so no image library is required.
// Run: npm run icons   (set PW_CHROMIUM_PATH to use a preinstalled Chromium)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const svg = await readFile(`${dir}icon.svg`, 'utf8');

// Maskable icons get cropped to a circle (safe zone = inner 80 %), so shrink the pet.
const targets = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-maskable-192.png', size: 192, scale: 0.78 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.92 },
];

const executablePath = process.env.PW_CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();

for (const { file, size, scale } of targets) {
  const scaled = svg.replace(
    'transform="translate(256 270) scale(1)"',
    `transform="translate(256 ${256 + 14 * scale}) scale(${scale})"`,
  );
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${scaled}`,
  );
  await writeFile(`${dir}${file}`, await page.screenshot({ type: 'png' }));
  console.log(`wrote ${file}`);
}

await browser.close();
