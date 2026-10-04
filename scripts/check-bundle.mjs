// Fails if the JavaScript needed for the first screen exceeds the gzipped budget.
// Lazy chunks (mini-games, shop, debug gallery) are excluded. Run after `npm run build`.
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 400;
const dist = new URL('../dist/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', dist), 'utf8'));

const entry = Object.values(manifest).find((c) => c.isEntry);
const seen = new Set();
const walk = (key) => {
  const chunk = manifest[key];
  if (!chunk || seen.has(chunk.file)) return;
  seen.add(chunk.file);
  for (const imp of chunk.imports ?? []) walk(imp);
};
walk(Object.keys(manifest).find((k) => manifest[k] === entry));

let total = 0;
for (const file of seen) {
  const size = gzipSync(await readFile(new URL(file, dist))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} kB  ${file}`);
}
const kb = total / 1024;
console.log(`Initial JS (gzip): ${kb.toFixed(1)} kB / ${BUDGET_KB} kB budget`);
if (kb > BUDGET_KB) {
  console.error('Bundle budget exceeded!');
  process.exit(1);
}
