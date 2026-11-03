# A01/A07: security disposition — 03.11.2026

Исходный HEAD `8514af5d0bbf4f77176b804b0d2445385e0f5082`; исправления в `feature/ee-documents`, без commit. Ниже перечислены исходные предупреждения, а не оставшиеся уязвимости финальной установки.

## Первичные источники и выбор версий

- Django LTS [официальные notes 5.2.18](https://github.com/django/django/blob/stable/5.2.x/docs/releases/5.2.18.txt), 06.10.2026; установлена **5.2.18**, Python >=3.10. Major Django не менялся.
- DRF [официальные release notes](https://github.com/encode/django-rest-framework/blob/master/docs/community/release-notes.md): 3.18.2 исправляет GHSA-33wh/3547/xw6w, 3.18.3 исправляет случайное изменение order_by_precedence. Установлена **3.18.3**, Django 5.2 поддерживается, Python >=3.10.
- Sqlparse [CHANGELOG 0.6.1](https://github.com/andialbrecht/sqlparse/blob/master/CHANGELOG): исправления и **End of Maintenance**, 01.11.2026. Установлена **0.6.1**, Python >=3.10; замена Django/SQL parser вне минимального безопасного обновления.
- [PyPI Django](https://pypi.org/pypi/Django/5.2.18/json), [DRF](https://pypi.org/pypi/djangorestframework/3.18.3/json), [sqlparse](https://pypi.org/pypi/sqlparse/0.6.1/json): metadata/requirements и vulnerabilities текущих и прежних pins сохранены в evidence. У выбранных версий vulnerabilities пусты.
- GitHub Advisory API был заблокирован CONNECT 403. Использованы доступные первичные release notes авторов через raw.githubusercontent.com и записи PyPI; прямое чтение заблокированного API не заявляется. PyPI дублирует часть записей под GHSA/PYSEC: ниже дедупликация по CVE, aliases остаются в JSON.

## Backend

В столбце affected указана проверенная исходная версия и нижняя исправленная версия из первичной записи, а не предположение о любом будущeм диапазоне. Во всех строках решение — установка указанной исправленной версии; неприменимость конкретного компонента не заменяет обновление.

| CVE / primary advisory | Пакет: affected → fixed-in | Применимость / решение | Доказательство |
|---|---|---|---|
| CVE-2026-35192, GHSA-7h2m-m8vj-598h | Django 5.2.13 → 6.0.5, 5.2.14 | SESSION_SAVE_EVERY_REQUEST/cache-путь в проекте не включён; исправлено обновлением, не основанием игнорировать на сервере. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-6907, GHSA-5hrc-gvxj-w55p | Django 5.2.13 → 6.0.5, 5.2.14 | UpdateCacheMiddleware отсутствует в base settings; исправлено для всего runtime. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-5766, GHSA-w26r-rmm8-9c29 | Django 5.2.13 → 6.0.5, 5.2.14 | Путь ASGI предусмотрен проектом; серверный WSGI/ASGI не известен. Исправлено, body limits сохранены. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-6873, GHSA-h7pc-vwp9-298g | Django 5.2.13 → 5.2.15, 6.0.6 | Прямое использование get_signed_cookie с управляемой клиентом солью не найдено; исправлено runtime. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-35193, GHSA-qpc8-7fxc-cm4p | Django 5.2.13 → 5.2.15, 6.0.6 | Shared cache middleware не используется; исправлено, фактический CDN проверяется отдельно. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-7666, GHSA-mm6v-q8q9-pgcf | Django 5.2.13 → 5.2.15, 6.0.6 | Отправка вызывает fail_silently=False; небезопасный режим повторного STARTTLS не используется. Исправлено. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-48587, GHSA-923m-gv2p-w5qp | Django 5.2.13 → 5.2.15, 6.0.6 | Shared cache middleware не используется; исправлено. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-8404, GHSA-8cjm-8mp7-r2xf | Django 5.2.13 → 5.2.15, 6.0.6 | Shared cache middleware не используется; исправлено. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-48588, GHSA-3h9f-r86x-qvjx | Django 5.2.13 → 5.2.16, 6.0.7 | Shared cache/cached view не найдены; исправлено. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-53878, GHSA-8qcx-xf44-272x | Django 5.2.13 → 5.2.16, 6.0.7 | Нет пользовательского DomainNameValidator → произвольный response header; исправлено. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-53877, GHSA-crhf-3pfg-w68w | Django 5.2.13 → 5.2.16, 6.0.7 | GeoDjango/GDALRaster не подключены; исправлено runtime. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-15830, GHSA-q238-5cxm-5c9h | Django 5.2.13 → 5.2.17, 6.0.8, 6.1.1 | GeoDjango/GEOSGeometry не подключены; исправлено runtime. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-15307, GHSA-wvqv-fj8w-qmhm | Django 5.2.13 → 5.2.17, 6.0.8 | Нет GIS fields/spatial lookups; исправлено также усилением 5.2.18. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-73228, GHSA-2m8g-3cmr-wg3w | djangorestframework 3.17.1 → 3.17.2 | Публичная форма принимает bounded form/multipart, не JSONParser. Исправлено DRF; собственные byte limits сохранены. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-73229, GHSA-g47c-3xmw-q6m2 | djangorestframework 3.17.1 → 3.17.2 | AdminRenderer (не Django Admin) не используется; post-only форма не раскрывает GET-данные. Исправлено DRF. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-114138, GHSA-33wh-fxxf-88vv | djangorestframework 3.17.1 → 3.18.2 | Применимо: negotiation до limiter, в том числе GET. Исправлено upstream max Accept 8192 / 64 tokens / 256 символов в media type, целевые тесты 406/405/200. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-114136, GHSA-3547-9m27-7rxg | djangorestframework 3.17.1 → 3.18.2 | JSONParser публичной формы не включён; безопасная проверка non-text charset возвращает 400 без записи. Исправлено DRF. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-114137, GHSA-xw6w-gcfp-cf8m | djangorestframework 3.17.1 → 3.18.2 | authtoken/TokenProxy не подключены; исправлено DRF. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-71491, GHSA-f2ff-p2ww-7p4p | sqlparse 0.5.5 → 0.6.0 | Нет публичного SQL editor/исполнения пользовательского SQL или генерации Python/PHP из SQL. Обновлено до 0.6.1; не эксплуатировалось. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-59894, GHSA-3496-9g83-7v6x | sqlparse 0.5.5 → 0.6.0 | Нет публичного SQL editor/исполнения пользовательского SQL или генерации Python/PHP из SQL. Обновлено до 0.6.1; не эксплуатировалось. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-59893, GHSA-prg7-hcfm-mfcr | sqlparse 0.5.5 → 0.6.0 | Нет публичного SQL editor/исполнения пользовательского SQL или генерации Python/PHP из SQL. Обновлено до 0.6.1; не эксплуатировалось. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-54284, GHSA-pwgv-4x5q-6m9f | sqlparse 0.5.5 → 0.6.0 | Нет публичного SQL editor/исполнения пользовательского SQL или генерации Python/PHP из SQL. Обновлено до 0.6.1; не эксплуатировалось. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |
| CVE-2026-84305, GHSA-cfqr-cjx5-5jcm | sqlparse 0.5.5 → 0.6.0 | Нет публичного SQL editor/исполнения пользовательского SQL или генерации Python/PHP из SQL. Обновлено до 0.6.1; не эксплуатировалось. | PyPI old-version JSON; pip-audit-final; выполненные SQLite/PostgreSQL suites |

Django 5.2.18 дополнительно закрывает CVE-2026-84429 (парсинг HTTP-заголовков, непосредственно relevant для negotiation), CVE-2026-77050 (language-code cache), CVE-2026-87890 (GIS byte values, не используется), CVE-2026-87975 (model formset с editable PK, такой путь здесь не найден) и усиливает исправление CVE-2026-15307. Источник — notes 5.2.18; прежний scanner не является полным списком последних исправлений.

## Frontend tooling

| ID | Пакет / affected range из npm advisory | Решение и применимость | Доказательство |
|---|---|---|---|
| GHSA-698v-4r3x-3vcv; GHSA-r825-w8mm-5pxw; GHSA-587h-7wmj-h5pm | Vite >=8.0.0 <=8.1.5 | Vite **8.3.5**. launch-editor/Windows dev path, не код публичного static dist. Не открывать dev server в Internet. | npm-audit исходного аудита; официальный Vite changelog; final npm-audit = 0 |
| GHSA-9jrq-w75r-8gcw; GHSA-rq7h-c2jc-7f22 | Vite >=8.0.0 <=8.1.5 | Vite **8.3.5**, middleware/fs.allow dev path. Отсутствие Vite на production не заменяет исправление среды разработки. | clean npm ci, build/preview/dev и browser tests |
| GHSA-mrhx-c7xc-m3w5 | zod <4.6.6 | **4.6.7**, штатное обновление внутри разрешённого upstream range eslint-plugin-react-hooks; override не нужен. | npm-tree, lockfile, audit=0 |
| GHSA-g3hv-75wg-m249 | minimatch <11.0.1 | **11.0.1**, два scoped override для eslint и @eslint/config-array. ESLint **10.14.0** и config-array **0.23.5** всё ещё требуют 10.x: поддерживаемое обновление не закрывает advisory само. | первичный advisory/CHANGELOG, изучены actual consumers, toolchain.test.mjs, полный lint и clean npm ci |

ESLint/конфиги/react-refresh в исходном audit являлись также транзитивно affected через minimatch/ESLint; это не отдельные независимые CVE. Без force/downgrade на ESLint 9 и без смены Vite/ESLint/test runner.

### Почему scoped override обоснован

Minimatch 11 удаляет makeRe(), AST, regexp, matchOne(), debug и меняет внутренний set. Проверены установленные потребители: ESLint eslint-helpers и config-array используют конструктор Minimatch и match(), включая partial directory traversal; удалённые API не используются. Добавлены тесты реального ESLint config resolution, include/ignore/traversal для приложения и тестов, dist/.vite. Полный lint проходит, Node 24.19 удовлетворяет engines. Native Windows здесь недоступен: ручной чек-лист обязателен; это ограничение платформенной проверки, а не утверждение проверенной совместимости всех Windows-путей. После upstream перехода на исправленный range overrides удалить отдельной проверенной правкой.

## Итог / остатки

- Финальные `pip check` — 0, pip-audit — 0 известных уязвимостей; npm audit — 0. Никакие advisory не скрыты ignore-флагами, thresholds или allowlist.
- **sqlparse 0.6.1 EOL** — незакрытый риск будущего сопровождения, не известная неустранённая CVE этой установки. Django LTS пока требует sqlparse. Следить за новыми advisory/планом Django; не обещать будущую поддержку пакета.
- Нет агрессивного DoS/эксплуатации, production checks или заявления абсолютной безопасности. Header fixtures ограничены несколькими килобайтами; изменялась только библиотека, admission/body/file/UUID контракты не переписаны.
- A01: известные предупреждения исправлены и проверены; EOL открыт как эксплуатационное ограничение. A07: предупреждения исправлены; узкие overrides требуют сопровождения до upstream fix.
