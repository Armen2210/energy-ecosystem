import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validatePage } from './prerender-validation.mjs';
import { parseBuildOptions } from './prerender-options.mjs';

const frontend = fileURLToPath(new URL('../', import.meta.url));
const buildScript = path.join(frontend, 'scripts/prerender.mjs');
const manifest = JSON.parse(await readFile(new URL('../dist/prerender-manifest.json', import.meta.url), 'utf8'));

async function snapshot(directory) {
  const result = {};
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else result[path.relative(directory, filename)] = {
        hash: createHash('sha256').update(await readFile(filename)).digest('hex'),
        mtimeMs: (await stat(filename)).mtimeMs,
      };
    }
  }
  await visit(directory);
  return result;
}

test('build options preserve quoted paths and reject unsupported or malformed arguments', () => {
  assert.deepEqual(parseBuildOptions([]), { outDir: 'dist' });
  assert.deepEqual(parseBuildOptions(['--outDir', 'output with spaces']), { outDir: 'output with spaces' });
  assert.deepEqual(parseBuildOptions(['--outDir=custom']), { outDir: 'custom' });
  for (const args of [['--unknown'], ['--mode', 'production'], ['unexpected'], ['--outDir'],
    ['--outDir='], ['--outDir', '--unknown'], ['--outDir', 'a', '--outDir', 'b']]) {
    assert.throws(() => parseBuildOptions(args));
    const run = spawnSync(process.execPath, [buildScript, ...args], { cwd: frontend, encoding: 'utf8' });
    assert.equal(run.status, 1, JSON.stringify(args));
    assert.match(run.stderr, /Prerender: (Unsupported build argument|--outDir requires|Specify --outDir)/);
    assert.doesNotMatch(run.stdout, /building|Prerender: \d/);
  }
});

test('custom output with spaces contains all artifacts and leaves dist unchanged', async () => {
  const before = await snapshot(path.join(frontend, 'dist'));
  const temporary = await mkdtemp(path.join(tmpdir(), 'ee-outdir-'));
  const output = path.join(temporary, 'output with spaces');
  try {
    const run = spawnSync(process.execPath, [buildScript, '--outDir', output], { cwd: frontend, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr + run.stdout);
    const custom = JSON.parse(await readFile(path.join(output, 'prerender-manifest.json'), 'utf8'));
    assert.deepEqual(custom.pages, manifest.pages);
    const customRoutes = custom.pages.filter((row) => row.route !== '/404').map((row) => row.route);
    for (const row of custom.pages) validatePage(await readFile(path.join(output, row.file), 'utf8'), row.route, customRoutes);
    for (const filename of ['sitemap.xml', 'prerender-routes.conf', 'robots.txt', 'analytics-frame.html']) {
      assert.equal(await readFile(path.join(output, filename), 'utf8'), await readFile(path.join(frontend, 'dist', filename), 'utf8'));
    }
    assert.deepEqual(await snapshot(path.join(output, 'assets')).then((files) => Object.keys(files).sort()),
      await snapshot(path.join(frontend, 'dist/assets')).then((files) => Object.keys(files).sort()));
    assert.deepEqual(await snapshot(path.join(frontend, 'dist')), before, 'dist files/content/mtime changed');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

const routes = manifest.pages.filter((row) => row.route !== '/404').map((row) => row.route);
const home = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');

test('all declared artifacts pass the mandatory content/metadata/isolation checks', async () => {
  assert.equal(routes.length, new Set(routes).size);
  for (const row of manifest.pages) {
    validatePage(await readFile(new URL('../dist/' + row.file, import.meta.url), 'utf8'), row.route, routes);
  }
  const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname), routes);
});

test('mandatory validation rejects a shell instead of public content', () => {
  assert.throws(() => validatePage(home.replace(/<main[\s\S]*?<\/main>/, ''), '/', routes));
});

test('mandatory validation rejects missing metadata, dead links and stale consent', () => {
  for (const corrupted of [
    home.replace(/<link rel="canonical"[^>]+>/, ''),
    home.replace(/href="\/solutions"/, 'href="/removed-product"'),
    home.replace('data-prerendered="true"', 'data-prerendered="false"'),
    home.replace('<fieldset', '<section class="cookie-banner"></section><fieldset'),
  ]) assert.throws(() => validatePage(corrupted, '/', routes));
});

test('mandatory validation rejects visitor fields and an enabled pre-hydration form', () => {
  assert.throws(() => validatePage(home.replace(/name="name" value=""/, 'name="name" value="private_visitor_marker"'), '/', routes));
  assert.throws(() => validatePage(home.replace('class="lead-form__fieldset" disabled=""', 'class="lead-form__fieldset"'), '/', routes));
});

test('mandatory validation rejects FAQ JSON-LD that differs from visible answers', async () => {
  const product = await readFile(new URL('../dist/solutions/bmk.html', import.meta.url), 'utf8');
  assert.throws(() => validatePage(product.replace(/(<p class="faq__answer">)[\s\S]*?<\/p>/, '$1invented answer</p>'), '/solutions/bmk', routes));
});
