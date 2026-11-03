# Исправления A01–A07 перед серверной подготовкой ЭЭ

**03.11.2026, Europe/Moscow.** Ветка `feature/ee-documents`, базовый и конечный HEAD **`8514af5d0bbf4f77176b804b0d2445385e0f5082`**. Конечное состояние — этот HEAD **плюс исправления**, перечисленные ниже. Это состояние проверки до коммита передачи; точный SHA передачи следует смотреть в Git (`fix: address release readiness audit findings`).

## Результат для владельца

**Код готов к подготовке целевой среды/staging. Готовность production не подтверждена.** A01/A02/A03/A05/A06/A07 исправлены в обозначенном объёме; **A04 закрыт для тяжёлого hero, дальнейшее разделение общего JS отложено**. Sqlparse EOL и временные minimatch overrides требуют сопровождения. Native Windows/Safari и реальный сервер в этой среде не проверены.

Не выполнялись commit, push, PR, merge, deploy, production migrations, перенос исторических файлов, SMTP или реальные цели Метрики. A08/A09, описания/FAQ и R1–R5 не изменялись. Исходный [аудит](release-readiness-audit.md) сохранён как исторический, его вердикт не переписан.

### База и сохранность работы

При начале checkout был `work@413ff414c1f5a9ec08fb517095ec6f4029a66fc4`, единственные локальные материалы — 56 неотслеживаемых файлов предыдущего аудита под `ee_site/docs/`. Удалённые refs: `main=413ff414…`, `feature/ee-documents=8514af5…`; изменений после проверенной версии не было. Получена удалённая ветка и разрешённо открыт локальный `feature/ee-documents`; исходные материалы сохранены. Remote fetch настроен только на main, поэтому локальная feature открыта без upstream tracking; это не мешает review и не является разрешением push.

`AGENTS.md` не обнаружены в применимых родительских каталогах/репозитории. Прочитаны frontend/backend/deploy README, исходный audit и runbooks. Исправления находятся **в рабочем checkout**, а временный исходный снимок использован только для before/after.

## 1. Статусы по замечаниям

| ID | Подтверждённая причина | Изменение | Проверки | Статус / остаточное ограничение |
|---|---|---|---|---|
| **A01** | Старые runtime pins, публичный content negotiation до POST limiter, в том числе GET | Django **5.2.18** в той же LTS; DRF **3.18.3**; sqlparse **0.6.1**, UTF-16/BOM requirements сохранены. Защита negotiation взята из исправленного upstream; custom bypass не добавлен | Первичные notes/PyPI, pip check, pip-audit=0; malformed/overlong Accept →406, valid GET →405, capabilities →200; non-text charset →400 без записи; полный SQLite/PG | **Известные advisory устранены.** Sqlparse 0.6.1 — финальный EOL release, а не обещание дальнейшей поддержки. Мониторить новые advisory/решение Django |
| **A02** | `started`/обычные поля не учитывали ответы и включённость ОЛ | Чистый предикат `hasDraftContent`: enabled choice, выключенные/свёрнутые ответы и выбранные секции учитываются; UI-only metadata, пустые строки/единицы/ID строк не считаются ответами. Тема и uncertain/retry защищены | 3 unit tests; 8 browser clear-сценариев на 360/1440: пустой, enabled, disabled answers, mixed+file+retry; cancel/confirm; submitting lock | **Закрыто.** Хранение/TTL/состав draft не расширены; используется прежний reset/confirm |
| **A03** | Отсутствовало имя native file input; orange/light text 2,5–2,8:1; JS entryScroll игнорировал reduce | `aria-label="Документы к заявке"`; отдельные readable accent/action tokens и адресные текстовые/CTA/focus правила. Яркий брендовый orange сохранён у логотипа/декора/прочих фонов. Для reduced-motion нет долгого entryScroll, hash также без smooth | axe на 4 страницах × 390/1440: **0 violations в выбранных состояниях**; keyboard/motion/frame probes, hover/focus/error/submitting; визуальный обзор 6 ширин | **Закрыто в проверенном объёме.** Не заявляется полный WCAG AA или native screen-reader/Safari acceptance |
| **A04** | Проектирование загружало JPEG 1 535 785 B, размер показа намного меньше | 3 responsive **lossless WebP**, EXIF-aware resize без crop/upscale, srcSet/sizes/intrinsic dimensions/eager/high priority. Оригинал сохранён побайтно, больше не импортируется в dist | Все места использования найдены; WebP DPR 1/2/3, осмотр mobile/desktop, отсутствие source JPEG в dist; 3+3 одинаковых лабораторных прогона | **Частично:** hero исправлен; дальнейший общий JS split отложен с объяснением ниже |
| **A05** | Frontend-only историческое «backend не меняется» читалось как инструкция всего релиза; default resolve ошибочно назывался read-only | Одна актуальная точка входа: backend electronic-questionnaires-release; deploy README — frontend/nginx-подплан с явной исторической областью. Сверены schema/contract/TTF/private/worker/rollback. Документированы row lock resolve и storage write readiness; уточнены CLI help | Сверка кода команд, миграций 0008–0010, settings/worker, ссылок. Никакие серверные команды не выполнялись | **Закрыто.** Фактические пути/units/env/backup целевого сервера ещё нужно обследовать |
| **A06** | TestCase atomic конфликтовал с реальными close_old_connections/закрытием direct FileResponse; повторный response.close повторял request_finished. SQLite не показывал эффект. Один platform-test предполагал SQLite даже на PG | TransactionTestCase там, где команды/direct responses реально закрывают соединения; не закрывать уже закрытый клиентской streaming-обёрткой response повторно, но закрывать при ранней ошибке и assert closed. Проверка отсутствия on_commit сохранена прямым assertion; SQLite-specific lock guard задан явно | Исходная full PG: **131 тест, 1 failure/23 errors** повторно воспроизведены. Финальная full PG **133/133**, SQLite **132 passed/1 PG-only skipped** | **Закрыто на Linux/PostgreSQL.** Assertions не удалены, исключения/cleanup не подавлены, production lifecycle не отключён. Windows native не выполнялся |
| **A07** | Vite advisories, transitive zod и minimatch | Vite **8.3.5**, ESLint **10.14.0**; zod **4.6.7** обычным разрешённым update. Два **scoped** override minimatch **11.0.1** для ESLint/config-array; без downgrade/force и смены инструментов | Clean `npm ci`, npm audit=0, actual dependency tree, 2 toolchain/glob tests, lint/build/prerender/dev/preview/browser workflows | **Закрыто с temporary overrides.** Их причина/API-совместимость и условие удаления описаны в README/security disposition; Windows paths включены в ручной чек-лист |

[Подробный security disposition: IDs, affected/fixed-in, применимость, источники и остатки](release-readiness-fixes-security.md). Все исходные предупреждения разобраны; ноль scan findings не объявляется доказательством абсолютной безопасности.

## 2. Изменения и сохранённые контракты

### A01/A07: почему выбраны эти версии

Проверены актуальные первичные PyPI metadata и официальные release notes авторов на **03.11.2026**. Установленные версии удовлетворяют Python **3.12.14**, Node **24.19.0**; `pip check` — No broken requirements. Django major/LTS не менялся. DRF 3.18.3 выбран вместо 3.18.2 также из-за исправления случайно изменённого `order_by_precedence`; свои ListSerializer API проект не использует. Новые схемные изменения не обнаружены.

У patched DRF negotiation ограничены длина Accept **8192**, количество токенов **64**, длина media type **256**; parsed list кешируется только на request. Сам порядок `super().initial()` → local POST limiter сохранён. Несколько небольших invalid header fixtures проверяют именно эту защиту, без агрессивного DoS и без ссылки на nginx как универсальное оправдание. Лимиты request/file/private/UUID/fingerprint не ослаблялись.

Latest ESLint 10.14.0/config-array 0.23.5 всё ещё зависят от vulnerable minimatch 10.x. Исправление есть только в 11.0.1; поэтому scoped overrides обоснованы, а не взяты из `audit fix --force`. Изучены actual consumers: используют `Minimatch`/`match()`, а удалённые makeRe/AST/regexp/matchOne не используют. Тестируется и directory traversal, и реальный ESLint include/ignore для JSX/JS/tests/dist/.vite. Это не проверка всех возможных внешних glob-конфигураций.

### A02/A03: поведение формы

Отмена очистки сохраняет значения, тему, consent, файлы и UUID/indeterminate; подтверждение использует существующий `leadDraft.reset()` и retire retry IDs. Выключенный/свёрнутый ОЛ с данными защищён, enabled-but-empty ОЛ тоже пользовательский выбор. Пустое состояние или одно только expanded/sheet/scroll/пустая строка коллектора не требуют диалога. Даже в промежутке до DOM commit обработчик по-прежнему проверяет общий submitting lock.

Readable orange используется для текста/контролов на светлом фоне; кнопки с белым текстом получили более тёмный orange. Базовые `--color-red`/`--color-red-dark`, изображения и декоративные orange-элементы не заменялись новой глобальной палитрой. Focus-outline file controls/ОЛ/submit усилен без изменения размеров и таб-порядка. Подписи, keyboard, sticky offsets и обычные non-reduced анимации сохранены.

### A05/A06: lifecycle и инструкции

Никаких changes production connection/resource cleanup ради тестов не делалось. Background worker тесты выполняются без внешнего TestCase atomic, поэтому команды вправе закрывать/переоткрывать соединения. Прямой admin FileResponse в legacy migration tests также вынесен из TestCase atomic. Client streaming wrapper уже закрывает response с правильным signal lifecycle при исчерпании; повторно вызывать close в finally нельзя, но незакрытый response при ранней ошибке всё равно закрывается. После cleanup есть assertion closed.

В тесте отсутствия fcntl SQLite branch проверяется явно независимо от реального DB driver; PostgreSQL advisory lock по-прежнему проверяется отдельным тестом. Это не пропуск Windows-сценария и не отключение assertions. Реальное поведение worker на PostgreSQL и snapshot/file rollback покрыты full suite.

`resolve_questionnaire_job --lead ID` без decision **берёт SELECT FOR UPDATE**, хотя не меняет строки. Его не следует включать в строго read-only обследование/запускать на read-only replica. `check_questionnaire_readiness` создаёт private root при необходимости и пишет/удаляет временный файл. Эти свойства теперь указаны в runbook и help; поведение команд не изменено.

## 3. A04: изображения и сопоставимые замеры

Источник: `src/assets/service-design-hero.jpg`, **2482×1755**, EXIF orientation отсутствует, **1 535 785 B**. Единственный runtime import был в `data/services.js`; ServicePage — потребитель, карточки используют свои существующие композиции. Оригинал сохранён побайтно; генератор `scripts/prepare-design-hero.py` применяет EXIF transpose, Lanczos resize и **lossless** WebP. Никаких crop, апскейла, художественной перерисовки или изменения чертежа.

| Вариант | Размер | Вес |
|---|---|---:|
| design-480.webp | 480×339 | 48 898 B |
| design-960.webp | 960×679 | 147 120 B |
| design-1536.webp | 1536×1086 | 300 456 B |

`sizes` учитывает не только ширину колонки, но и contain/высоту visual: mobile до ~331 px, tablet ~419 px, desktop ~487 px для самого рисунка. Три варианта покрывают обычный показ и DPR до 3 без увеличения исходника. При DPR 1/2/3 на 360/1440 проверена фактическая загрузка WebP. Width/height задают исходную пропорцию, CSS contain/композиция сохранены. Это preview-иллюстрация, не обещание чтения всего технического чертежа без увеличения на 360 px.

[Размеры/хеши](release-readiness-fixes-evidence/image-summary.json), [mobile — внешний артефакт](release-handoff-external-artifacts.md), [desktop — внешний артефакт](release-handoff-external-artifacts.md). В финальном dist **нет** `service-design-hero-*.jpg`.

### Сравнение

Результаты и runners сохранены **вне checkout** в `/tmp/ee-fixes/evidence/performance-comparison.*`; компактная копия [JSON](release-readiness-fixes-evidence/performance-comparison.json) приложена для review.

Исходная сборка — точный снимок `8514af5` в отдельном каталоге; исправленная — текущий checkout. Одинаковые nginx fixture без gzip, Chromium **154**, viewport **390×900**, DPR 1, новый context/cold cache на каждый прогон, CPU **4×**, latency **100 ms**, download **200 000 B/s**, upload 100 000 B/s, внешняя сеть блокирована. Замер после networkidle+700 ms, по **3 прогона** последовательно каждой версии; остальные тяжёлые browser runs к тому моменту завершены.

| Показатель `/services/design` | До | После |
|---|---|---|
| LCP, ms, три прогона | 12200 / 13116 / 11988 | 2280 / 2304 / 2248 |
| Диапазон LCP | 11,99–13,12 с | 2,25–2,30 с |
| Медиана LCP | 12,20 с | 2,28 с |
| CLS | 0,001564 во всех прогонах | 0,001564 во всех прогонах |

Это фактическое улучшение **лабораторной загрузки этой страницы**, не Lighthouse score и не прогноз production. Сравниваются целые версии, включая toolchain update; выигрыш не приписывается исключительно одному изменению без оговорки. Network entries подтверждают исчезновение JPEG 1,54 MB. Полевая скорость/INP/CDN/cache/gzip/Brotli сервера не измерены.

### Общий JS — остаток A04

Финальный main **513 081 B / gzip 136 582 B** против исходных **515 280 / 137 110 B**; небольшая разница после обновления bundler/кода не выдаётся за самостоятельную оптимизацию скорости. Deferred QuestionnaireEditor сохранён. Предупреждение Vite >500 kB остаётся, порог не повышен.

Дальнейший split требует отдельно исследовать общий App/data/SSR/prerender graph и поведение уже открытых вкладок/форм/аналитики; немедленная широкая переделка дала бы высокий риск при небольшом доказанном выигрыше. Поэтому **не объявляю весь A04 полностью закрытым**. Это P2, не блокер серверной подготовки.

## 4. Финальные проверки и ограничения

F = `/workspace/energy-ecosystem/ee_site/frontend`, B = `.../ee_site/backend`, PY = `/tmp/ee-fixes/venv/bin/python`. Никаких backend `.env` в проверяемом checkout не было; frontend `.env.example` автоматически не активировался. Для test settings `.env` не читается. PostgreSQL **17.11 UTF-8** на отдельном Unix socket `/tmp/ee-fixes`, port 55449, peer auth/no TCP listener. Браузерный API: отдельная `ee_fixes`, временные private/media/rate; email **locmem**. `fixes_pg.py`/`fixes_local.py` находятся вне приложения и приложены только как методика.

| Команда / проверка | Каталог / окружение | Exit | Результат |
|---|---|---:|---|
| `git ls-remote origin refs/heads/main refs/heads/feature/ee-documents` | исходный checkout, HTTPS proxy | 0 | База совпала с аудитом; более поздних feature commits нет |
| `pip install -r requirements/base.txt` в новом venv; `pip check` | B, точные pins | 0 / 0 | Установка и совместимость пакетов без отключения TLS |
| `pip-audit --disable-pip --no-deps -r python-frozen.txt --format=json` | отдельный security venv | 0 | **0 известных vulnerabilities**, без ignore/исключений |
| `npm ci --include=dev --no-audit --no-fund` | F, чистый node_modules по lock | 0 | Воспроизводимая установка |
| `npm audit --json`, `npm ls vite eslint minimatch zod` | F | 0 / 0 | **0 findings**, корректный peer/dependency tree |
| `npm test` | F, Node 24.19 | 0 | **61 passed**, 0 skipped: прежние 56 + 3 clear predicate + 2 toolchain/glob |
| `npm run lint` | F | 0 | Без ошибок/предупреждений lint |
| `npm run build` | F, default analytics off | 0 | **20 публичных HTML + 404**, main chunk warning сохранён |
| `npm run test:prerender` | F после завершённого build | 0 | **11 passed**, включая custom outDir с пробелами/артефакты/isolation |
| `VITE_EE_ANALYTICS_ENABLED=true npm run build -- --outDir /tmp/ee-fixes/analytics-dist` | F, отдельный dist только для mocks | 0 | Production default не включался; все внешние цели перехвачены |
| `npm run dev -- --host 127.0.0.1 --port 5274 --strictPort` | F, Vite 8.3.5, локальный API 8030 | runtime smoke | Числа/ОЛ/scroll/download browser suites прошли |
| `npm run preview -- --host 127.0.0.1 --port 4274 --strictPort` + GET `/services/design` | F, локально | 0 HTTP probe | Готовый HTML возвращён; preview не выдан за production nginx |
| `$PY manage.py check --settings=config.settings.test` | B, SQLite/locmem | 0 | System check без замечаний |
| `$PY manage.py makemigrations --check --dry-run --settings=config.settings.test` | B | 0 | No changes detected; новых миграций после 0010 нет |
| `$PY manage.py test --settings=config.settings.test --noinput` | B | 0 | **133 tests: 132 passed, 1 PostgreSQL-only skipped** |
| `PYTHONPATH=/tmp/ee-fixes/config $PY manage.py test --settings=fixes_pg --noinput` | B, PostgreSQL | 0 | **133 passed, 0 skipped**, включая concurrency/worker/private/rollback |
| Исходный `$PY_OLD manage.py test --settings=baseline_pg --noinput` | неизменённый временный снимок SHA/старый venv | **1** | Повторно **131 tests, 1 failure/23 errors**; before A06, не итог исправлений |
| `SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs` с NGINX_BIN/MIME/Playwright/Chrome | F, реальный nginx+sentinel | 0 | **8 passed**, HTTP/SEO/no-JS/hydration/privacy/documents; 14 файлов exact bytes/MIME/HEAD |
| `node scripts/release-fixes-browser.mjs` с FIXES_TEST_ORIGIN=local nginx | F, POST запрещён | 0 | **12 групп**, clear/cancel/confirm/OL-only/files/retry, reduced-motion, WebP 360/1440; 0 errors/blocked requests |
| `node scripts/questionnaires-refinement-browser.mjs` с local origin/API | F, Vite+PostgreSQL/locmem | 0 | Числа/единицы/reload/route, реальный multipart 2 ОЛ+файл, 502 после commit, same-id retry |
| `node scripts/questionnaire-scroll-downloads-browser.mjs` | F, capability mocked, POST запрещён | 0 | **246 anchor checks**, 16 сочетаний 4 изделий/fresh/restored/360/390, download/import/backend cases |
| `DRAFT_DIST=.../analytics-dist node scripts/lead-draft-browser.mjs` | F, сеть/POST/цели перехвачены | 0 | **20 групп**, fields/files/consent/SPA/policy/cookies, SHA/POST lock, delayed unmounted responses, errors/retry/timers |
| `ANALYTICS_DIST=... ANALYTICS_TEST_API=http://127.0.0.1:8030 node scripts/analytics-browser.mjs` | F, mock tag.js и local API | 0 | **23 группы**, consent/revoke/staging gate/first-last/dedup/blocked library, без передачи ПД |
| `integration.py` | PostgreSQL ee_fixes, locmem | 0 | 201 / 200 duplicate / 409 изменённого payload; 4 snapshots/PDF; одно письмо с 4 PDF, worker repeat skipped |
| `browser-review.mjs` | Chromium/nginx, 8 маршрутов×6 ширин | 0 | **48 проверок**, overflow нет, errors/failed requests нет; снимки форм/ОЛ/главной просмотрены |
| `a11y.mjs` / axe | `/`, `/documents`, `/solutions/vns`, `/about` ×390/1440 | 0 runner | **0 violations** в выбранных состояниях. Incomplete/manual области не объявляются WCAG pass |
| `states.mjs` | synthetic 429, focus/hover/submitting; DPR 1/2/3 | 0 | Проверка технического disabled свойства fieldset и реальной disabled clear; картинки/ошибки без production POST |
| `git diff --check` | рабочий checkout | 0 | Без whitespace errors |

Предварительные неуспешные проверки не скрыты: два nginx/browser запуска пересеклись с очисткой dist при rebuild (ENOENT/404), затем полный запуск выполнен после завершения сборки и прошёл. Один перегруженный параллельный lead-draft run дал timeout focus/Enter; отдельный повтор **без изменения теста/таймаутов** прошёл все 20 групп. В новом motion probe URL изменяется до React commit: кадры старого DOM отделены по canonical, assertion отсутствия анимации новой страницы сохранён. В standalone states-probe fieldset проверяется через `HTMLFieldSetElement.disabled`, а actual clear button — через Playwright `isDisabled`.

Chromium/Linux и mobile emulation **не равны** native Android/iOS/Safari/Windows. Мобильная клавиатура/resize и reduced-motion проверяются эмуляцией и существующими runners; реальный screen-reader не запускался. Реальный tag.js/кабинет Метрики/SMTP delivery/CDN не проверялись. Успешный HTTP 201 — сохранение, locmem message — проверка приложения, не доставка письма адресату.

## 5. Файлы, diff и требования к серверу

Изменены **30 tracked файлов**, добавлены **8 файлов приложения/вспомогательных тестов/генератора/assets** плюс новый отчёт/security disposition/evidence. Полный перечень с SHA-256 кода: [manifest](release-readiness-fixes-evidence/changed-code-manifest.json). Полный текстовый/binary diff и тяжёлые доказательства сохранены [вне checkout](release-handoff-external-artifacts.md). При упаковке для Git отчёты дополнены сведениями о передаче; прежние снимки состояния остались внешними историческими артефактами.

Группы изменений:

- Backend: `requirements/base.txt`; test lifecycle в `tests.py`, `tests_worker.py`, `tests_legacy_migration.py`, `tests_protection.py`; уточнение help двух диагностических команд; README/runbook/deploy README.
- Frontend: `package.json`/`package-lock.json`; `api/leadDraftContent.js` и unit test, подключение в LeadForm; имя FileSelect; ScrollToTop; адресные CSS/три functional color tokens.
- Image: 3 WebP в `src/assets/services/design`, их data/ServicePage props и воспроизводимый `scripts/prepare-design-hero.py`.
- Новые проверки: `scripts/toolchain.test.mjs`, `scripts/release-fixes-browser.mjs`. Система тестов прежняя Node/Django; application hooks для тестов не добавлены.

**Новых env vars/таблиц/моделей/миграций нет.** На сервер нужно установить изменённый UTF-16 requirements в его venv, пересобрать полный frontend по новому lockfile, включив новые WebP и прежние документы/assets. Python 3.12 / Node 24 проверены; прежние Linux/DejaVu/subprocess/resource/private/rate/temp/worker требования ОЛ остаются. Схемы до 0010 и contract `contracts/questionnaires/v1` всё равно обязательны: текущая правка не отменяет подготовку исходного выпуска.

Не проверены целевой SHA/runtime/Gunicorn/nginx/CDN/WAF, текущие migrations/legacy media, backup **и восстановление**, владельцы/права/temp/disk/limiter topology, supervised workers, SMTP delivery и реальные Метрика/поисковые кабинеты. Для допуска к обновлению использовать актуальный [полный runbook](../backend/docs/electronic-questionnaires-release.md), обследовать и проверить staging отдельно. Не заменять живой vhost шаблоном.

Откат после приёма ОЛ не должен удалять 0008–0010/новые snapshots/job/private files или возвращать старый backend без worker. Выключить новую приёмку, вернуть согласованно полный предыдущий frontend root/include, сохранить старые chunks и уже принятые записи; uncertain SMTP расследовать до resend. Резервная копия без проверенного восстановления не является закрытой приёмкой.

## 6. Короткий ручной Windows-чек-лист

1. Проверить branch/HEAD/diff, Node 24 и Python 3.12; не использовать production `.env`, DB/storage/mail.
2. Из frontend выполнить `npm ci --include=dev`, `npm test`, `npm run lint`, обычный build и `test:prerender`; повторить `npm run build -- --outDir "C:\\temp\\EE output"`. Проверить ESLint glob/ignore и отсутствие node_modules/dist в lint.
3. Запустить dev/preview локально: главная, проектирование, documents и 404, ширины 360/390/640/768/960/1440; проверить srcSet при DPR 1/2/3, отсутствие JPEG 1,54 MB в network и незапланированных внешних запросов.
4. Клавиатурой пройти тему, выбор/удаление файлов, ОЛ, cookies/policy и clear. ОЛ-only enabled/disabled/collapsed и смешанный draft: cancel сохраняет всё, confirm очищает; пустой draft без лишнего dialog. In-flight submit блокирует clear.
5. Включить Windows «уменьшение анимации» и отдельно обычный режим: product/header entryScroll, hash, Back/Forward/modal return, sticky offsets и focus без длительной анимации в reduced режиме.
6. Для Django использовать `--settings=config.settings.test`; PostgreSQL suite — только отдельная тестовая БД. Нативный Windows не предоставляет Unix `resource` для bounded PDF subprocess: **не отключать лимиты ради pass**; полный Linux worker/PDF набор повторять в WSL2/Linux. Возможные platform-specific результаты фиксировать отдельно, не выдавать за подтверждение Windows-server support.
7. Проверить synthetic ОЛ/обычную заявку и loss/429/413/retry только на локальном API с тестовой почтой. Настоящий SMTP/Метрику не включать. Результаты/exit codes прислать без `.env`, credentials и клиентских документов.

## 7. Ответы на три итоговых вопроса

1. **A01–A07 полностью закрыты?** Известные security findings и подтверждённые функциональные/тестовые дефекты устранены; A04 **частично**, общий JS split отложен. EOL sqlparse, временные overrides и непроверенные native platforms явно остаются ограничениями, а не скрытыми «зелёными» обещаниями.
2. **Код готов к серверной подготовке?** **Да**, в проверенном Linux/Node24/Python3.12/PostgreSQL контуре, после review владельца коммита исправлений. Новой схемы относительно 0010 нет.
3. **Production готов?** **Не установлено.** Нужны перечисленные серверные/staging/backup/worker/SMTP проверки и отдельное разрешение на внедрение. Локальные тесты их не заменяют.

## Передача через Git

Компактная упаковка выполнена 03.11.2026 без изменения проверенного кода приложения. Полные внешние материалы: [каталог](release-handoff-external-artifacts.md). Пошаговая [локальная приёмка Windows](release-handoff-windows.md) использует отдельные временные настройки, SQLite/storage и console email. После commit/push точный SHA и состояние доступны в Git; приведённый выше HEAD — база тестирования. Полный suite повторно не запускался: изменились только упаковка и документация.
