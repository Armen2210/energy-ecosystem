"""Build and switch EE release 64 on the existing VPS."""

import fcntl
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

BASE = Path("/var/www/ee_site")
REPO = BASE / "repo"
OLD = "e9f98a20256320b045d55a8f4bf6d9c2c50802ec"
NEW = "9536313147d46f0c45659075aada0038942a4c88"
RELEASE = BASE / "releases" / NEW
FRONTEND = RELEASE / "ee_site/frontend"
DIST = FRONTEND / "dist"
OLD_DIST = BASE / "releases" / OLD / "ee_site/frontend/dist"
HOST = "www.energoeffekt-rostov.ru"
CAPABILITIES = "/api/leads/questionnaire-capabilities/"
REMOVED = (
    "/documents/certificates/products/asta-valves-seismic.pdf",
    "/documents/certificates/products/pipes-certificates-2022.pdf",
)


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def git(*args):
    return run("git", "-C", str(REPO), *args)


def git_output(path, *args):
    return subprocess.check_output(["git", "-C", str(path), *args], text=True).strip()


def get(route):
    result = run(
        "curl", "-sS", "--noproxy", HOST, "--connect-timeout", "3", "--max-time", "10",
        "--resolve", f"{HOST}:443:127.0.0.1", "-w", "\n%{http_code}", f"https://{HOST}{route}",
        stdout=subprocess.PIPE,
    )
    body, _, status = result.stdout.rpartition(b"\n")
    return int(status), body


def expect(route, status, file=None):
    actual, body = get(route)
    if actual != status or (file is not None and file.read_bytes() != body):
        raise RuntimeError(f"{route}: HTTP {actual}, ожидался HTTP {status} с содержимым релиза")
    return body


def wait_for_home(dist):
    for attempt in range(20):
        try:
            expect("/", 200, dist / "index.html")
            return
        except (RuntimeError, subprocess.CalledProcessError):
            if attempt == 19:
                raise
            time.sleep(1)


def active_config():
    candidates = []
    configs = {p.resolve(strict=True) for p in Path("/etc/nginx/sites-enabled").iterdir() if p.is_file()}
    for config in configs:
        original = config.read_text()
        for dist in (OLD_DIST, DIST):
            if re.search(r"(?m)^\s*root\s+" + re.escape(str(dist)) + r";\s*$", original):
                candidates.append((config, original, dist))
    if len(candidates) != 1:
        raise RuntimeError("Не найден единственный ожидаемый root сайта в nginx")
    return candidates[0]


def replace_config(config, text):
    metadata = config.stat()
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=config.parent, delete=False) as file:
        temporary = Path(file.name)
        try:
            file.write(text)
            file.flush()
            os.fchown(file.fileno(), metadata.st_uid, metadata.st_gid)
            os.fchmod(file.fileno(), metadata.st_mode & 0o7777)
            os.replace(temporary, config)
        finally:
            temporary.unlink(missing_ok=True)


def verify_release():
    pages = json.loads((DIST / "prerender-manifest.json").read_text())["pages"]
    if len(pages) != 24:
        raise RuntimeError("Ожидается 23 публичные страницы и 404")
    assets = set()
    for page in pages:
        route = page["route"]
        content = expect(route, 404 if route == "/404" else 200, DIST / page["file"])
        assets.update(re.findall(rb'(?:src|href)="(/assets/[^"<>]+\.(?:js|css))"', content))
    for asset in sorted(assets):
        route = asset.decode()
        expect(route, 200, DIST / route.lstrip("/"))
    for name in ("robots.txt", "sitemap.xml"):
        expect("/" + name, 200, DIST / name)
    for path in sorted((DIST / "documents").rglob("*")):
        if path.is_file():
            expect("/" + path.relative_to(DIST).as_posix(), 200, path)
    for route in REMOVED:
        expect(route, 404)
    expect("/__ee_release_probe_64", 404)
    print("OK: 23 страницы, 404, JS/CSS, sitemap, robots и документы", flush=True)


def deploy():
    config, original, active_dist = active_config()
    if active_dist == DIST:
        verify_release()
        expect(CAPABILITIES, 200)
        print(f"Уже опубликован {NEW}", flush=True)
        return
    include = re.compile(r"(?m)^\s*include\s+" + re.escape(str(OLD_DIST / "prerender-routes.conf")) + r";\s*$")
    if len(include.findall(original)) != 1:
        raise RuntimeError("Действующий include маршрутов не совпадает с релизом")
    expect("/", 200, OLD_DIST / "index.html")
    before = json.loads(expect(CAPABILITIES, 200))
    expect("/api/leads/", 405)
    git("fetch", "origin", "main")
    if git_output(REPO, "rev-parse", "FETCH_HEAD") != NEW:
        raise RuntimeError("origin/main указывает на другой коммит")
    if not RELEASE.exists():
        git("worktree", "add", "--detach", str(RELEASE), NEW)
    if git_output(RELEASE, "rev-parse", "HEAD") != NEW or git_output(
        RELEASE, "status", "--porcelain", "--untracked-files=no"
    ):
        raise RuntimeError("Каталог релиза содержит другой коммит или локальные правки")

    env = {
        **os.environ,
        "VITE_API_BASE_URL": "",
        "VITE_EE_ANALYTICS_ENABLED": "true",
        "VITE_EE_CALLTOUCH_ENABLED": "true",
    }
    for args in (("ci", "--include=dev"), ("test",), ("run", "lint"), ("run", "build"), ("run", "test:prerender")):
        run("npm", *args, cwd=FRONTEND, env=env)
    for source in (OLD_DIST / "assets").rglob("*"):
        if not source.is_file():
            continue
        target = DIST / "assets" / source.relative_to(OLD_DIST / "assets")
        if target.exists():
            if source.read_bytes() != target.read_bytes():
                raise RuntimeError(f"Конфликт версий ресурса {target.name}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)

    backup_root = BASE / "deploy-backups"
    backup_root.mkdir(mode=0o700, exist_ok=True)
    backup = Path(tempfile.mkdtemp(prefix="release-64-", dir=backup_root)) / config.name
    shutil.copy2(config, backup)
    print(f"Резервная копия nginx: {backup}", flush=True)
    if config.read_text() != original:
        raise RuntimeError("Конфигурация nginx изменилась во время сборки")
    try:
        replace_config(config, original.replace(str(OLD_DIST), str(DIST)))
        run("nginx", "-t")
        run("systemctl", "reload", "nginx")
        wait_for_home(DIST)
        verify_release()
        if json.loads(expect(CAPABILITIES, 200)) != before:
            raise RuntimeError("Ответ API опросников изменился")
        expect("/api/leads/", 405)
    except BaseException:
        print("Проверка не прошла. Возвращаю прежнюю версию.", flush=True)
        replace_config(config, backup.read_text())
        run("nginx", "-t")
        run("systemctl", "reload", "nginx")
        wait_for_home(OLD_DIST)
        print("Откат проверен.", flush=True)
        raise
    print(f"ГОТОВО: опубликован {NEW}", flush=True)


if __name__ == "__main__":
    if os.geteuid() != 0:
        raise SystemExit("Запустите на VPS от root")
    with (BASE / ".frontend-deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        deploy()
