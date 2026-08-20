import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 1. Load + validate content JSON
const viDir = join(root, 'src/lib/content/vi');
const names = readdirSync(viDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
const content = {};
const invalid = [];
for (const n of names) {
  try { content[n] = JSON.parse(readFileSync(join(viDir, n + '.json'), 'utf8')); }
  catch { invalid.push(`${n}.json: invalid JSON`); }
}
if (invalid.length) { console.error(invalid.join('\n')); process.exit(1); }

// 2. Walk src for contentGet/contentItems('path') calls
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p, out); }
    else if (extname(p) === '.jsx' || extname(p) === '.js') { out.push(p); }
  }
  return out;
}
const files = walk(join(root, 'src'));

const pathRe = /content(?:Get|Items)\(\s*'([^']+)'/g;
const drift = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let m;
  while ((m = pathRe.exec(src)) !== null) {
    const rel = join('src', m[1]);
    if (!rel.startsWith('src/')) continue; // not a content path
    const parts = m[1].split('.');
    let node = content[parts[0]];
    // array/object-list roots: contentItems('x.items') where x.items is object map or array
    for (let i = 1; i < parts.length && node; i++) {
      node = node[parts[i]];
    }
    if (node === undefined) drift.push(`${f.replace(root + '\\', '').replace(root + '/', '')}: '${m[1]}' no longer resolves`);
  }
}

if (drift.length) {
  console.error(drift.join('\n'));
  console.error(`\n${drift.length} content key(s) drifted — refresh JSON or update call sites.`);
  process.exit(1);
}
console.log(`OK: ${names.length} content JSON valid, ${files.length} source files checked, no key drift.`);
