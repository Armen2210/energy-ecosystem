import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Real nginx + current dist, with a loopback sentinel upstream. No public API,
// database, SMTP, account or production server is accessed.
const frontend = fileURLToPath(new URL('../', import.meta.url));
const fragment = path.resolve(frontend, '../deploy/nginx_technical_seo.conf.example');
const nginx = process.env.NGINX_BIN || 'nginx';
const mimeTypes = process.env.NGINX_MIME_TYPES || '/etc/nginx/mime.types';
let upstream, server, run, origin;
const sitemap = await readFile(path.join(frontend, 'public/sitemap.xml'), 'utf8');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
const rows = [];

async function request(url) {
  const response = await fetch(origin + url, { redirect: 'manual' });
  const body = await response.text();
  rows.push({ path: url, status: response.status, location: response.headers.get('location') });
  return { response, body };
}

before(async () => {
  run = await mkdtemp(path.join(tmpdir(), 'ee-seo-nginx-'));
  upstream = createServer((req, res) => {
    // Any POST indicates an invalid test: never simulate or send a lead here.
    assert.equal(req.method, 'GET');
    const status = req.url.endsWith('/not-found/') ? 404 : req.url.startsWith('/api/') ? 429 : 401;
    res.writeHead(status, {
      'Content-Type': 'application/json', 'Retry-After': '17', 'X-SEO-Upstream': 'sentinel',
    });
    res.end(JSON.stringify({ upstream: true }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  const config = `pid "${run}/nginx.pid";
error_log "${run}/error.log";
events { worker_connections 128; }
http {
  include "${mimeTypes}";
  access_log off;
  client_body_temp_path "${run}/body";
  proxy_temp_path "${run}/proxy";
  fastcgi_temp_path "${run}/fastcgi";
  uwsgi_temp_path "${run}/uwsgi";
  scgi_temp_path "${run}/scgi";
  server {
    listen 127.0.0.1:${port};
    server_name localhost;
    add_header X-SEO-Server "inherited-always" always;
    root "${frontend}/dist";
    location ^~ /api/ { proxy_pass http://127.0.0.1:${upstream.address().port}; }
    location ^~ /admin/ { proxy_pass http://127.0.0.1:${upstream.address().port}; }
    location ^~ /static/ { return 204; }
    location ^~ /media/ { return 403; }
    include "${fragment}";
  }
}`;
  await writeFile(path.join(run, 'nginx.conf'), config);
  const check = spawnSync(nginx, ['-p', run + '/', '-c', path.join(run, 'nginx.conf'), '-t'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr || check.error?.message);
  server = spawn(nginx, ['-p', run + '/', '-c', path.join(run, 'nginx.conf'), '-g', 'daemon off;']);
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { await fetch(origin); ready = true; break; } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assert.ok(ready, 'nginx did not start');
});

after(async () => {
  if (server && server.exitCode === null) {
    const stopped = once(server, 'exit');
    server.kill('SIGTERM');
    await stopped;
  }
  upstream?.closeAllConnections();
  if (upstream?.listening) await new Promise((resolve) => upstream.close(resolve));
  if (run) {
    await writeFile(path.join(run, 'routes.json'), JSON.stringify(rows, null, 2));
    console.log('HTTP evidence:', path.join(run, 'routes.json'));
  }
});

test('every sitemap page and its query variant returns actual HTML 200', async () => {
  assert.ok(pages.length > 0, "sitemap must contain public pages");
  assert.equal(new Set(pages).size, pages.length);
  for (const url of pages) {
    const { response, body } = await request(url);
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(body, /<div id="root"><\/div>/);
    assert.equal((await request(url + '?utm_source=local')).response.status, 200, url);
  }
});

test('missing general/entity/historical URLs return 404 without masking redirects', async () => {
  for (const url of ['/missing', '/solutions/missing', '/services/missing', '/cases/missing',
    '/404', '/about-us', '/raskhodomery', '/About', '/SOLUTIONS/bmk', '/missing/', '/missing.html', '/cases/btp-hotel-complex/extra']) {
    const { response, body } = await request(url);
    assert.equal(response.status, 404, url);
    assert.equal(response.headers.get('location'), null, url);
    assert.match(body, /Страница не найдена/);
    assert.match(body, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(body, /rel="canonical"/);
  }
});

test('server always headers survive public HTML, internal 404 and analytics frame', async () => {
  for (const [url, status] of [['/about', 200], ['/missing', 404], ['/404.html', 404], ['/analytics-frame.html', 200]]) {
    const { response } = await request(url);
    assert.equal(response.status, status, url);
    assert.equal(response.headers.get('x-seo-server'), 'inherited-always', url);
  }
});

test('only confirmed aliases and known trailing-slash variants redirect permanently', async () => {
  for (const url of ['/contacts', '/contacts/']) {
    const { response } = await request(url + '?utm_source=local');
    assert.equal(response.status, 301);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname + destination.search + destination.hash, '/?utm_source=local#contacts');
  }
  for (const url of pages.filter((p) => p !== '/')) {
    const { response } = await request(url + '/?utm_source=local');
    assert.equal(response.status, 301, url);
    assert.equal(new URL(response.headers.get('location')).pathname, url);
    assert.equal(new URL(response.headers.get('location')).search, '?utm_source=local');
  }
  assert.equal((await request('/index.html')).response.status, 301);
});

test('assets, discovery files and analytics frame remain reachable', async () => {
  const index = (await request('/')).body;
  const asset = index.match(/src="([^"]+\.js)"/)[1];
  assert.equal((await request(asset)).response.status, 200);
  assert.equal((await request('/assets/missing.js')).response.status, 404);
  for (const url of ['/robots.txt', '/sitemap.xml', '/favicon.svg', '/og-image.jpg', '/site.webmanifest']) {
    assert.equal((await request(url)).response.status, 200, url);
  }
  const frame = await request('/analytics-frame.html');
  assert.equal(frame.response.status, 200);
  assert.match(frame.body, /name="robots" content="noindex, nofollow"/);
});

test('API/admin are passed to the existing upstream without swallowing status or Retry-After', async () => {
  for (const [url, status] of [['/api/leads/', 429], ['/admin/login/', 401], ['/api/not-found/', 404], ['/admin/not-found/', 404]]) {
    const { response, body } = await request(url);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('retry-after'), '17');
    assert.equal(response.headers.get('x-seo-upstream'), 'sentinel');
    assert.deepEqual(JSON.parse(body), { upstream: true });
  }
  assert.equal((await request('/static/test.css')).response.status, 204);
  assert.equal((await request('/media/private-test')).response.status, 403);
});

// Optional combined run: reuse this exact nginx fixture for the browser suite,
// then stop both servers in after(). No hand-edited local config is needed.
if (process.env.SEO_BROWSER === 'true') {
  test('browser SEO checks against the same isolated nginx fixture', async () => {
    const runner = spawn(process.execPath, [path.join(frontend, 'scripts/technical-seo-browser.mjs')], {
      cwd: frontend,
      env: { ...process.env, SEO_TEST_ORIGIN: origin },
      stdio: 'inherit',
    });
    const [code] = await once(runner, 'exit');
    assert.equal(code, 0, 'browser runner failed');
  });
}
