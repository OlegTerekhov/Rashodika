const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const capacitor = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const icon = fs.readFileSync('icon.svg', 'utf8');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length, 'No inline JavaScript found');
for (const [i, match] of scripts.entries()) {
  if (match[1].trim()) {
    new Function(match[1]);
    console.log('PASS: inline JavaScript syntax #' + (i + 1));
  }
}

for (const id of [
  'procedureForm', 'materialForm', 'clientForm', 'historyBody',
  'materialList', 'clientList', 'backupExport', 'backupFile', 'clearData'
]) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing required UI element: ' + id);
}
console.log('PASS: required app UI elements');

assert.equal(manifest.short_name, 'Расходика');
assert.ok(manifest.start_url && manifest.display === 'standalone');
assert.ok(icon.includes('<svg') && icon.includes('</svg>'));
assert.equal(capacitor.appId, 'ru.terekhov.rashodika');
assert.equal(capacitor.webDir, 'www');
assert.ok(pkg.scripts && pkg.scripts['build:web']);
assert.ok(pkg.scripts['build:web'].includes('privacy.html'), 'Android bundle must include privacy policy');
assert.ok(html.includes('href="./privacy.html"'), 'Privacy policy link must be visible in app');
assert.ok(fs.existsSync('privacy.html'), 'Privacy policy file missing');
console.log('PASS: manifest, icon, Capacitor, privacy policy and build config');

const checks = [
  ['local persistence', /localStorage\.getItem\(KEY/.test(html) && /localStorage\.setItem\(KEY/.test(html)],
  ['material stock deduction', /m\.stockRemaining=stockOf\(m\)-i\.quantity/.test(html)],
  ['stock restoration on procedure deletion', /stockOf\(m\)\+Math\.max\(0,num\(i\.quantity\)\)/.test(html)],
  ['backup export and import', /rashodika-backup-/.test(html) && /JSON\.parse\(await file\.text\(\)\)/.test(html)],
  ['safe text escaping', /const safe=s=>/.test(html)],
  ['CSV export', /function exportCSV\(\)/.test(html)]
];
for (const [name, ok] of checks) assert.ok(ok, 'Missing core feature check: ' + name);
console.log('PASS: core feature markers (' + checks.length + ')');
console.log('QA smoke checks passed.');
