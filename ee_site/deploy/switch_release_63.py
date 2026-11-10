"""One-off EE release 63 switch, with preflight, verification and rollback.

Run as root on the existing EE VPS after preparing the pinned release.
No database migrations or lead submissions are performed.
"""

import json, os, re, shutil, subprocess, tempfile, time
from pathlib import Path

old = '8b9cbb0448f70ad007a5f1d91eef9584a51c40eb'
new = 'e9f98a20256320b045d55a8f4bf6d9c2c50802ec'
base = Path('/var/www/ee_site/releases')
old_dist = base / old / 'ee_site/frontend/dist'
dist = base / new / 'ee_site/frontend/dist'
backend = base / new / 'ee_site/backend'
units = ['ee_site_gunicorn.service', 'ee-questionnaires.service', 'ee-calltouch.service']
files = [Path('/etc/systemd/system') / unit for unit in units]
nginx_candidates = {
    file.resolve(strict=True)
    for file in Path('/etc/nginx/sites-enabled').iterdir()
    if file.is_file() and re.search(
        r'(?m)^\s*root\s+' + re.escape(str(old_dist)) + r';\s*$',
        file.read_text(),
    )
}
assert len(nginx_candidates) == 1, 'Не найдена единственная конфигурация текущего релиза'
nginx = nginx_candidates.pop()
print(f'Конфигурация nginx: {nginx}', flush=True)
files.append(nginx)
host = 'www.energoeffekt-rostov.ru'

def run(*args):
    return subprocess.run(args, check=True)

def get(route, expected=200):
    for attempt in range(6):
        result = subprocess.run([
            'curl', '-sS', '--connect-timeout', '3', '--max-time', '15',
            '--resolve', f'{host}:443:127.0.0.1', '-w', '\n%{http_code}',
            f'https://{host}{route}',
        ], capture_output=True)
        body, _, status = result.stdout.rpartition(b'\n')
        if result.returncode == 0 and status == str(expected).encode():
            return body
        if attempt < 5:
            time.sleep(1)
    raise RuntimeError(f'GET {route}: status={status!r}, curl={result.returncode}')

assert os.geteuid() == 0, 'Нужен root'
assert (backend / '.env').is_file() and (backend / '.venv/bin/python').is_file()
pages = json.loads((dist / 'prerender-manifest.json').read_text())['pages']
assert len(pages) == 21
texts = {file: file.read_text() for file in files}
assert all(old in text for text in texts.values()), 'Неожиданная конфигурация служб/nginx'
updated = {file: text.replace(old, new) for file, text in texts.items()}
word_urls = [f'/documents/certificates/products/{name}-2026.docx'
             for name in ['ee-bmk-declaration', 'ee-boilers-declaration']]
word_rules = '\n'.join(
    f'    location = {url} {{\n'
    '        types { application/vnd.openxmlformats-officedocument.wordprocessingml.document docx; }\n'
    '        try_files $uri =404;\n'
    '    }' for url in word_urls
    if not re.search(r'location\s+=\s+' + re.escape(url) + r'\s*\{', updated[nginx]))
updated[nginx], count = re.subn(
    r'(?m)^([ \t]*root[ \t]+' + re.escape(str(dist)) + r';[ \t]*)$',
    lambda match: match[0] + '\n' + word_rules, updated[nginx])
assert count == 1, 'Не найден единственный root сайта'

# Keep assets referenced by already-open tabs; never overwrite the new build.
for source in (old_dist / 'assets').rglob('*'):
    if not source.is_file():
        continue
    target = dist / 'assets' / source.relative_to(old_dist / 'assets')
    if target.exists():
        assert source.read_bytes() == target.read_bytes(), f'Конфликт assets: {target.name}'
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
before = json.loads(get('/api/leads/questionnaire-capabilities/'))
for unit in units[:2]:
    run('systemctl', 'is-active', '--quiet', unit)
timer_active = subprocess.run(['systemctl', 'is-active', '--quiet', 'ee-calltouch.timer']).returncode == 0
backup_root = Path('/var/www/ee_site/deploy-backups')
backup_root.mkdir(mode=0o700, exist_ok=True)
backup = Path(tempfile.mkdtemp(prefix='e9f98a2-', dir=backup_root))
for index, file in enumerate(files):
    shutil.copy2(file, backup / str(index))
(backup / 'manifest.json').write_text(json.dumps([str(file) for file in files]))
print(f'Резервная копия: {backup}', flush=True)

try:
    run('systemctl', 'stop', 'ee-calltouch.timer')
    for file, text in updated.items():
        file.write_text(text)
    run('nginx', '-t')
    run('systemctl', 'daemon-reload')
    run('systemctl', 'restart', *units[:2])
    run('systemctl', 'reload', 'nginx')
    for row in pages:
        assert get(row['route'], 404 if row['route'] == '/404' else 200) == (dist / row['file']).read_bytes(), row['route']
    print('OK: 20 страниц и 404', flush=True)
    index = (dist / 'index.html').read_bytes()
    for url in set(re.findall(rb'(?:src|href)="(/assets/[^"<>]+)"', index)):
        route = url.decode()
        assert get(route) == (dist / route.lstrip('/')).read_bytes(), route
    documents = list((dist / 'documents/certificates/products').glob('*'))
    documents.append(dist / 'documents/other/ee-gs1-2026.pdf')
    documents = [file for file in documents if file.is_file() and file.suffix in ('.pdf', '.docx')]
    assert len(documents) >= 12
    for file in documents:
        assert get('/' + str(file.relative_to(dist))) == file.read_bytes(), file.name
    print(f'OK: assets и {len(documents)} документов', flush=True)
    assert json.loads(get('/api/leads/questionnaire-capabilities/')) == before, 'Настройки ОЛ изменились'
    get('/api/leads/', 405)
    get('/__ee_release_probe_e9f98a2', 404)
    for unit in units[:2]:
        run('systemctl', 'is-active', '--quiet', unit)
    for unit in units:
        directory = subprocess.check_output(['systemctl', 'show', unit, '-p', 'WorkingDirectory', '--value'], text=True).strip()
        assert directory == str(backend), unit
    if timer_active:
        run('systemctl', 'start', 'ee-calltouch.timer')
    print('ГОТОВО: опубликован релиз ' + new, flush=True)
    print('Проверены страницы, assets, документы, API и службы. Реальные заявки не отправлялись.')
except BaseException as error:
    print(f'ОШИБКА: {error}. Выполняется откат.', flush=True)
    rollback_errors = []
    for index, file in enumerate(files):
        try:
            shutil.copy2(backup / str(index), file)
        except Exception as failure:
            rollback_errors.append(str(failure))
    for args in [('systemctl', 'daemon-reload'), ('systemctl', 'restart', *units[:2]), ('nginx', '-t')]:
        try:
            run(*args)
        except Exception as failure:
            rollback_errors.append(str(failure))
    try:
        run('nginx', '-t')
        run('systemctl', 'reload', 'nginx')
        if timer_active:
            run('systemctl', 'start', 'ee-calltouch.timer')
        for unit in units[:2]:
            run('systemctl', 'is-active', '--quiet', unit)
        assert json.loads(get('/api/leads/questionnaire-capabilities/')) == before
        assert get('/') == (old_dist / 'index.html').read_bytes()
    except Exception as failure:
        rollback_errors.append(str(failure))
    if rollback_errors:
        print('ОТКАТ ТРЕБУЕТ ПРОВЕРКИ: ' + '; '.join(rollback_errors), flush=True)
    else:
        print('ОТКАТ ПРОВЕРЕН: работает прежний релиз.', flush=True)
    raise SystemExit(1)
