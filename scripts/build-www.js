// Assembles the Capacitor web root (www/) from the flat project layout.
//
// This app has no bundler — index.html and its assets live at the repo root and
// load libraries from vendor/. Capacitor needs a single webDir, so we copy the
// shippable files into www/. Run via `npm run build:www` (cap sync calls it too).

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');

// Files/dirs that make up the deployable web app. Everything else (node_modules,
// android/, api/, server.js, scripts/, www/ itself) is intentionally excluded.
const FILES = ['index.html'];
const DIRS = ['css', 'js', 'public', 'vendor'];

function rmrf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(out);
fs.mkdirSync(out, { recursive: true });

for (const f of FILES) {
  const s = path.join(root, f);
  if (!fs.existsSync(s)) throw new Error(`build:www — missing required file: ${f}`);
  fs.copyFileSync(s, path.join(out, f));
}

for (const dir of DIRS) {
  const s = path.join(root, dir);
  if (!fs.existsSync(s)) {
    console.warn(`build:www — skipping missing dir: ${dir}`);
    continue;
  }
  copyDir(s, path.join(out, dir));
}

console.log(`build:www — assembled www/ from ${[...FILES, ...DIRS].join(', ')}`);
