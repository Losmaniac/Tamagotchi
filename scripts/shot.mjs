// Dev helper: screenshot a URL of the running dev/preview server at phone size.
// Usage: node scripts/shot.mjs <url> <out.png> [waitMs] [width] [height]
import { chromium } from '@playwright/test';

const [url, out, wait = '1500', w = '390', h = '844'] = process.argv.slice(2);
const executablePath = process.env.PW_CHROMIUM_PATH;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
const logs = [];
page.on(
  'console',
  (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`),
);
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(url);
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
