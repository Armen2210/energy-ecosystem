# Энергоэффект: соответствие целям и готовность к обновлению

Дата проверки: **3 ноября 2026, Europe/Moscow**. Область: `ee_site`, связанный контракт `contracts/questionnaires/v1`, инструкции внедрения. Это аудит, без исправления приложения и без production-действий.

## 1. Версия и вывод для владельца

**Вердикт: не готово к серверному обновлению до закрытия security-gate A01 и проверки целевой инфраструктуры.** Подготовку сервера, резервирования и staging можно начинать. Основные сценарии проверенной ветки работают локально; оснований переписывать описания/FAQ или переделывать сайт целиком не найдено. Публикация сейчас не подтверждена ни состоянием сервера, ни доставкой почты, ни реальными данными поисковых кабинетов.

| Что зафиксировано | Значение |
|---|---|
| Рабочий checkout | `/workspace/energy-ecosystem`, ветка `work` |
| Его HEAD | `413ff414c1f5a9ec08fb517095ec6f4029a66fc4` |
| Начальное рабочее дерево | Чистое, включая неотслеживаемые файлы по `git status --short` |
| Удалённый `main` | `413ff414c1f5a9ec08fb517095ec6f4029a66fc4` |
| Запрошенная удалённая ветка | `feature/ee-documents` |
| **Фактически проверенная версия** | **`8514af5d0bbf4f77176b804b0d2445385e0f5082`** |
| Отношение к main | `main...feature/ee-documents`: 0 / 10 коммитов; main — предок |
| Проверяемые незакоммиченные правки приложения | Нет |
| Версия production | Не установлена; старые PR/README не использованы как её доказательство |

Ветка рабочего checkout не соответствует заданию. Она **не переключалась**. Для проверки получены refs в отдельный bare object store `/tmp/ee-release-audit/objects`, а точный `git archive` SHA распакован в `/tmp/ee-release-audit/target`. Это временный снимок для аудита, не Git worktree. `git ls-remote` повторён в конце: SHA обеих удалённых веток не изменились. После проверок содержимое **707 tracked blobs** снимка совпало с Git-объектами: [проверка целостности](release-readiness-evidence/snapshot-integrity.json). Созданный отчёт находится в исходном checkout на `work`; он сам не переводит checkout на проверенную ветку.

`AGENTS.md` не найдены в `/`, `/workspace`, исходном checkout и снимке. Изучены точки входа README, актуальные документы content-audit, документы/ОЛ, final-package, аналитика, request protection, legacy migration, worker и deploy. Исторические результаты отделены от новых запусков ниже. Все исходные ссылки/пути далее относятся к **SHA 8514af5**, даже если одноимённый файл в рабочем main старее или отсутствует. [Неизменяемая версия на GitHub](https://github.com/Armen2210/energy-ecosystem/tree/8514af5d0bbf4f77176b804b0d2445385e0f5082).

### Решения и история

- Решение владельца от 11.10.2026 сохранять описания/FAQ пяти изделий и трёх услуг и отложить R1–R5 зафиксировано в `frontend/docs/content-audit/product-service-review.md`. `git diff main..8514af5 -- .../data/products.js .../data/services.js` пуст: эти тексты не переписаны.
- `d3dafac` добавил документы; `fa69003` — устойчивые электронные ОЛ; `08232a8`, `2423008`, `0aa14d9` — точность, неопределённые ответы и редактирование; `9d73b6c` — высоты форм; `118f5c6`, `2e5ba2b`, `7f46fa0` — фотографии, каталоги, отложенный редактор; `8514af5` — прокрутка и скачивание бланков.
- Более поздняя переработка каталогов **есть**: `2e5ba2b`, `frontend/docs/final-package.md`, `scripts/final-package.test.mjs`. Каталоги используют прежние данные и карточки. Наличие коммита само по себе не доказывает отдельное согласование владельца, но и не позволяет объявить изменение несогласованным. Для выпуска следует принять именно текущий пакет визуально, а не исходить из старой отсрочки каталогов.
- Ссылок «Все продуктовые направления»/«Все инженерные услуги» на главной нет; `/solutions`, `/services` сохранены. Hero-ссылки на секции продукции/услуг — другие действующие элементы, их удаление этим решением не предусмотрено.
- Старая `/about` с прежними разделами и увеличением фотографий заменена посланием директора и **27 фотографиями**. На текущей `/about` нет прежнего viewer. Для кейсов модальное представление и галереи сохранены. Их нельзя считать потерянной функцией только по сравнению со старым README.

## 2. Безопасность и условия проверки

Node **24.19.0**, npm **11.9.0**, Python **3.12.14**, Chromium **154.0.8037.57 / Debian Linux**, nginx **1.26.3**, PostgreSQL **17.11**, ReportLab **4.4.10**. В репозитории нет отдельной фиксации Python/Node runtime; package-lock и Python requirements использованы без изменения. Requirements — UTF-16 с BOM. Gunicorn не входит в requirements: его production-версия должна проверяться отдельно.

В снимке нет backend `.env`, во frontend есть только `.env.example`. Экспортированные значения секретов не выводились. Тестовые настройки `config.settings.test` не читают `.env`, используют SQLite `:memory:`, locmem email и тестовый ключ. Для PostgreSQL созданы отдельные настройки вне приложения: [audit_pg.py — внешний артефакт](release-handoff-external-artifacts.md), [audit_local.py — внешний артефакт](release-handoff-external-artifacts.md). Отдельный кластер доступен только по Unix socket с peer-аутентификацией; БД `ee_audit`/временная `test_postgres`, private/media/rate/temp — под `/tmp/ee-release-audit`. Это не production и не БД прежней onboarding-проверки.

Браузеры направлены на локальные Vite/nginx/API. Внешние запросы и POST, где он не нужен, блокируются. В тестах аналитики public-looking URL обслужены Playwright до сети; `tag.js`/цели перехвачены. Для интеграционных POST используются синтетические данные и locmem, без SMTP. Перехват 502 выполнен **после реального локального сохранения**, а не вместо сохранения.

nginx/PostgreSQL извлечены во временный каталог из Debian-пакетов: проверены подписанные индексы APT и хеши пакетов; системные службы не устанавливались. TLS/подписи, CSP и права доступа приложения не ослаблялись. Chromium запускался headless с `--no-sandbox` в изолированной среде тестов; это не настройка публикуемого сайта. Playwright и axe установлены/использованы вне package/lock приложения.

## 3. Матрица соответствия целям

«Выполнено» ниже означает подтверждение в проверенном коде/локальном сценарии; оно **не переносится на production**.

| Цель / требование | Фактическая реализация | Доказательство: код / тест / браузер / HTTP | Статус | Что осталось |
|---|---|---|---|---|
| Понятно представить 5 изделий и 3 услуги | Различимые страницы, обзор, состав, исходные данные, FAQ, форма | `data/products.js`, `services.js`, prerender 11/11, HTTP всех маршрутов | выполнено | Не расширять тексты ради SEO; R1–R5 отложены владельцем |
| Доверие и сведения о компании | Послание директора, 27 фото, 5 подробных кейсов, контакты, документы | `/about`, `/cases`, `/documents`; визуальные снимки и HTML | частично | Подлинность/актуальность фактов подтверждает владелец; сайты/фото не являются внешней экспертизой производства |
| Desktop/mobile | Адаптивные карточки, формы, ОЛ, sticky navigation | 48 route/width проверок на 360/390/640/768/960/1440, просмотр снимков | частично | Контраст, имя file input, reduced-motion; реальные Safari/iOS/Android не проверены |
| Скорость и устойчивость | Prerender, responsive WebP, lazy фото, deferred editor | build, сеть браузера, 9 лабораторных прогонов | частично | A04: тяжёлый hero проектирования; большой initial JS; production сжатие/кеши неизвестны |
| Обычная заявка с документами | Несколько порций файлов, общий draft, lock до hash, UUID/retry, private storage | 56 frontend tests, 130 SQLite tests, lead-draft browser, local API | выполнено | SMTP и конкретная серверная конфигурация — отдельная приёмка |
| Электронные ОЛ | ВНС/ПНС/БМК/БТП, условные секции, версия/снимки, PDF, durable job | 25/25 профильных PostgreSQL tests; реальный multipart 2 ОЛ; интеграция 4 ОЛ | частично | A02: подтверждение очистки ОЛ-only; supervised worker/SMTP на сервере |
| Защита клиентских данных | Новые файлы приватны, staff/permission download, bounded parser, rate store, без ПД в аналитике | `lead_creation.py`, `upload_protection.py`, admin, tests; synthetic PDF | частично | A01 dependency security; historical media/backup/permissions на сервере неизвестны |
| Поисковая доступность | 20 готовых публичных HTML + 404, canonical/sitemap/robots/JSON-LD | nginx 8/8, no-JS/hydration/FAQ/browser | выполнено | Целевые nginx/CDN/WAF, фактический повторный обход и индексация |
| Содержательное SEO | Назначения страниц различимы, исходные данные и следующий шаг, реальные материалы | текущие data/HTML, стабильность 8 текстов относительно main | частично | Нет данных спроса/запросов; качество лидов и эффективность гипотез не измерены |
| Измерение обращений/источников | Consent gate, 7 целей, first/last, одна lead_success для заявки с/без ОЛ | 40+ составных тестов внутри актуальной suite, analytics-browser mocks | частично | Отдельной цели/параметра состава ОЛ нет; кабинет Метрики и получение событий не проверены |
| Реальная видимость Яндекс/Google/ИИ | Нет кабинетов, выгрузок и доступного поискового режима | внешние запросы заблокированы прокси; приложение «поиска» не доступно | не проверено | Протокол и 16 запросов в приложении ниже |
| Понятный код и воспроизводимый выпуск | Общие данные/contract, отдельные worker/renderer, lockfiles, runbooks | чтение кода, install/build/migrate/preflight | частично | A05 старый deploy-текст; A06 PostgreSQL test harness; фиксировать серверный runtime |
| R1–R5, переписывание восьми описаний/FAQ | Не выполнялись | решение владельца + пустой diff data | отложено владельцем | Не являются блокерами |

### Четыре уровня готовности

| Уровень | Результат |
|---|---|
| Код | Основные сценарии реализованы; P0 не обнаружены. Security-review runtime-зависимостей A01 не закрыт |
| Локальная проверка | Большой набор проходит; 25/25 профильных PostgreSQL tests проходят; полная PostgreSQL suite имеет дефекты harness, не объявляется зелёной |
| Серверная конфигурация | Не обследована. Потребуются миграции 0008–0010, contract, шрифт, worker, private/rate/temp, nginx и backup/restore |
| Фактический production | Не проверен: недоступен из разрешённой сети; версия, SMTP, кабинеты, индексация/ИИ неизвестны |

## 4. Выполненные проверки

Рабочие каталоги: `F=/tmp/ee-release-audit/target/ee_site/frontend`, `B=.../ee_site/backend`; `PY=/tmp/ee-release-audit/venv/bin/python`. `PYTHONPATH=/tmp/ee-release-audit/config` только для audit settings. Путь внешнего Playwright: `/opt/codex/cua_node/lib/node_modules/playwright-core/index.mjs`, `CHROME_PATH=/usr/bin/chromium`. Сохранённые [материалы проверки](release-readiness-evidence/) содержат логи и отдельные диагностические runners. Это артефакты аудита, а не новые тесты приложения.

| Проверка / команда | Среда, каталог | Exit code | Фактический результат и предел доказательства |
|---|---|---:|---|
| `git ls-remote origin refs/heads/main refs/heads/feature/ee-documents` | исходный checkout, HTTPS proxy | 0 | SHA зафиксированы дважды; без checkout/reset/merge |
| `npm ci --include=dev --no-audit --no-fund` | F, lockfile | 0 | Зависимости снимка установлены |
| `python -m pip install -r requirements/base.txt` | отдельный venv, B | 0 | Все pins, включая ReportLab/Pillow; TLS проверяется |
| `npm test` | F, elevated execution | 0 | **56 passed**, 0 skipped: API/files/analytics/documents/domain/numeric/topic |
| `npm run lint` | F | 0 | Без ошибок; [лог](release-readiness-evidence/lint.txt) |
| `npm run build` | F, VITE-флаги не заданы, `.env` не читается | 0 | **20 публичных HTML + 404**, предупреждение main >500 kB |
| `npm run test:prerender` | F после этой сборки | 0 | **11 passed**; старый дефект main из onboarding здесь отсутствует |
| `$PY manage.py check --settings=config.settings.test` | B, SQLite/locmem | 0 | System check без проблем |
| `$PY manage.py makemigrations --check --dry-run --settings=config.settings.test` | B | 0 | No changes detected; не доказывает состояние production migrations |
| `$PY manage.py test --settings=config.settings.test --noinput` | B | 0 | **131 найден, 130 passed, 1 PostgreSQL-only skipped** |
| `... test apps.leads.tests_questionnaire_postgres --settings=audit_pg --noinput` | отдельный PostgreSQL 17 UTF-8 | 0 | **1 passed**, реальная конкуренция принятия/worker |
| `... test apps.leads.tests_questionnaires apps.leads.tests_questionnaire_postgres --settings=audit_pg --noinput` | B, PostgreSQL/locmem/temp | 0 | **25 passed**, без skipped |
| `... test --settings=audit_pg --noinput` | B, полная PostgreSQL suite | **1** | **131 test, 1 failure + 23 errors**, без skipped; A06 |
| `... test apps.leads.tests_worker.BackgroundNotificationTests.test_one_shot_processes_only_pending_and_can_be_run_again --settings=audit_pg --noinput` | B, отдельный запуск | **1** | Та же проблема соединения внутри TestCase воспроизведена отдельно |
| `manage.py migrate --settings=audit_local --noinput` | только отдельная `ee_audit` | 0 | Применены схемы до leads 0010, не production |
| `manage.py check_questionnaire_readiness --settings=audit_local` | B, test DB/private/DejaVu | 0 | DB/schema/font/private готовы; probe пишет временный файл; не доказательство supervisor/SMTP |
| `NGINX_BIN=... NGINX_MIME_TYPES=... SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs` | F, локальный nginx + sentinel upstream | 0 | **8 passed**; включает technical-seo, prerender, privacy, documents browser. Реальные HTTP 200/301/404, JSON/Retry-After |
| `node scripts/questionnaires-refinement-browser.mjs` с `QUESTIONNAIRE_TEST_ORIGIN=http://127.0.0.1:5273`, `QUESTIONNAIRE_TEST_API_ORIGIN=http://127.0.0.1:8029` | Vite + отдельный PostgreSQL/locmem API | 0 | Числа/единицы/mobile input/reload/Back/Forward, реальный multipart **2 ОЛ + файл**, 502 после commit, retry той же заявки |
| `node scripts/questionnaire-scroll-downloads-browser.mjs` с origin 5273 | F, capability mock, POST запрещён | 0 | **246 viewport-anchor checks**, 16 сочетаний 360/390 × 4 изделия × fresh/restored; 8 download hashes, import/backend failure |
| `VITE_EE_ANALYTICS_ENABLED=true npm run build -- --outDir /tmp/ee-release-audit/analytics-dist` | F, отдельная сборка | 0 | Только для mock-проверки аналитики; стандартный dist не заменён |
| `DRAFT_DIST=.../analytics-dist node scripts/lead-draft-browser.mjs` | F, URL/API/цели перехвачены | 0 | **20 групп** на 360/1440: files, SHA/POST lock, delayed/unmounted responses, retries/errors, timers, cookies/policy, независимые новые вкладки |
| `ANALYTICS_DIST=.../analytics-dist ANALYTICS_TEST_API=http://127.0.0.1:8029 node scripts/analytics-browser.mjs` | F, mock tag.js + local API | 0 | Consent/revoke/storage/blocker, SPA, first/last/retry/dedup, staging gate, отсутствие синтетических ПД в payload. Не реальные события Метрики |
| [integration.py — внешний артефакт](release-handoff-external-artifacts.md) | PostgreSQL `ee_audit`, locmem | 0 | 201 → 200 duplicate, изменение →409; 4 snapshots/PDF, job done, **одно** locmem-письмо с 4 PDF; повтор worker skipped |
| runtime ordinary worker через `call_command('process_lead_notifications')` вне TestCase | PostgreSQL `ee_audit`, background/locmem | 0 | Pending → sent, **одно** письмо. Подтверждает отличие A06 от runtime-дефекта |
| [browser-review.mjs — внешний артефакт](release-handoff-external-artifacts.md) | nginx dist, Chromium | 0 | 8 маршрутов × 6 ширин = **48**; overflow ≤1 px, 0 pageerror/HTTP error; отдельные снимки форм/ОЛ |
| [a11y.mjs — внешний артефакт](release-handoff-external-artifacts.md), axe WCAG A/AA | 4 страницы × 390/1440 | 0 у runner | **Есть нарушения** color-contrast/label; нулевой exit runner не является WCAG pass. `/documents` без автоматических нарушений |
| [clear-questionnaire.mjs — внешний артефакт](release-handoff-external-artifacts.md) | local production UI | 0 у probe | Воспроизведён A02: заполненный ОЛ-only очищается без dialog |
| [motion.mjs — внешний артефакт](release-handoff-external-artifacts.md) | `reducedMotion: reduce`, 390 px | 0 у probe | Воспроизведён A03: 124 различных scrollY в 168 кадрах новой страницы |
| [performance.mjs — внешний артефакт](release-handoff-external-artifacts.md) | Chromium, 3 страницы × 3 прогона | 0 | Лабораторные LCP/CLS/long tasks; условия и пределы ниже |
| `npm audit --json` | F, registry advisory API | **1** | 8 affected packages: 2 high, 6 moderate; dev tree, подробности A01/A07 |
| `pip-audit --disable-pip --no-deps -r python-frozen.txt --format=json` | отдельный security venv | **1** | 39 записей advisory в 3 пакетах; после дедупликации ID **23** (13 Django, 5 DRF, 5 sqlparse) |
| GET публичного сайта/robots/sitemap и официальных справок | разрешённый proxy route | transport blocked | CONNECT **403** до сайта; это не HTTP-статус приложения. [Доказательство](release-readiness-evidence/external-access.json) |

Первоначальная попытка PostgreSQL создала SQL_ASCII при `--no-locale`; JSON с кириллицей закономерно не принимался. Кластер заменён **отдельным UTF-8 кластером**, профильные тесты повторены и прошли. Это устранённая ошибка настройки аудита. Первый запуск lead-draft на flag-off build ждал mock-счётчик; повторён на документированной отдельной flag-on сборке и прошёл. Сначала prerender выполняется после build с теми же VITE-переменными. Тесты/ожидания ради зелёного результата не менялись.

## 5. Что проверено по компонентам

### Заявки и файлы

Действующие обращения: общая форма на главной/деталях, CTA к ней, tel/mailto; формы с включёнными ОЛ используют **тот же** `/api/leads/`. Публичные бланки скачиваются без формы и без аналитического согласия. Автоматического отправления скачанного бланка нет.

- Имя/телефон обязательны в UI и serializer; согласие обязательно в UI. Тема входит в description, структурированное направление передаётся отдельно. API не хранит отдельный audit trail согласия: это не доказательство юридической достаточности политики.
- Файлы: 10, до 10 МиБ каждый/25 МиБ суммарно, несколько выборов, порядок, удаление/re-add; пустые файлы и сочетание legacy `attachment` с `attachments` отклоняются. Сервер не полагается на UI.
- `api/leadDraft.js` общий для SPA. Поля/ОЛ сохраняются в sessionStorage на срок 24 часа от содержательного изменения; File bytes не сохраняются, после reload файлы выбираются снова, согласие снимается. Просмотр/листание не продлевают срок. TTL проверяется при восстановлении; отдельного фонового удаления из уже открытой памяти/хранилища по таймеру нет. Это уточнение поведения, а не обещание гарантированной физической очистки браузера ровно через 24 часа.
- Lock приобретается до асинхронного hash, хранится вне компонента и не снимается unmount. Неизменный retry сохраняет UUID. Сигнатура включает файлы/ОЛ, исключает факультативную attribution/direction. После неопределённого ответа изменение требует предупреждения о возможном дубле.
- 201/200 считаются успехом только при валидном ID; с ОЛ дополнительно требуется точный accepted products/version. Некорректный success, gateway/сеть сохраняют неопределённость. 429/413 не очищают draft; structured 400/409 отделены от неоднозначного ответа.
- Cookies/политика/ошибка счётчика не стирают форму. Успех после ухода со страницы сохраняется; таймеры 5/5,6 с относятся к видимому сообщению, не к новым полям/ошибке. Новые независимые вкладки проверены; дублирование вкладки средствами браузера с возможным первоначальным копированием sessionStorage отдельно не проверялось.

### Опросные листы и PDF

Актуальное формализованное ТЗ внутри репозитория: `contracts/questionnaires/v1/README.md`, `fields.json`, `examples/`, принятые XLSX/PDF и последующие refinement/scroll материалы. Нового внешнего ТЗ или оригинальных файлов вне Git у аудитора нет; инженерная полнота требований вне этих материалов не подтверждается.

| Изделие | Текущий состав |
|---|---|
| ВНС | Технические данные (9 полей) + примечания |
| ПНС | Технические данные (12 полей, условный жокей-насос) + примечания |
| БМК | 8 листов: loads/ov/dhw/fuel/water/scheme/equipment/notes |
| БТП | Общие данные + 6 независимо включаемых секций; 3 коллектора с 6 полями строки, до 100 выходов на коллектор |

Пара значений/единиц сохраняется без разрушительного округления; сервер сам вычисляет canonical Decimal. 1 Гкал_IT/ч = 1163 кВт, 1 м³ = 1000 л, 1 кгс/см² = 0,0980665 МПа. Клиентские производные величины не доверяются. Обязательность/целые/min/условные поля проверяются с обеих сторон; технические пределы не объявляются рекомендациями подбора. Выключенные и неприменимые ответы остаются в draft, но не попадают в payload/PDF. Включённые свёрнутые ОЛ отправляются. Backend отклоняет дубли изделий/JSON-ключей, неизвестные версии/поля, лишние активные ответы и превышение размеров; не создаёт вместо некорректного ОЛ обычную заявку.

Заявка/ответы/contact snapshot/definition/job атомарны. Схема и контакты сохраняются на момент принятия; изменение Lead не переписывает PDF. Генерация отделена от HTTP, bounded subprocess (45 с wall/30 с CPU/512 МиБ), UUID token fencing, проверка размера/SHA, повторное использование готовых PDF. После `sending` неоднозначный SMTP ведёт к `uncertain/unknown`, без автоматического resend. Управление такими случаями требует решения сотрудника, не слепого retry.

В новой интеграции: БМК **30 205 B**, БТП **55 954 B**, ПНС **28 600 B**, ВНС **28 273 B**, SHA совпали; PDF attachments в одном locmem-письме. `pdftotext -layout` всех четырёх подтверждает кириллицу/единицы; первая страница БТП просмотрена визуально: [снимок — внешний артефакт](release-handoff-external-artifacts.md). Максимальные/условные payload, rollback uploads, missing snapshots, stale leases, corruption/reuse и MIME priority покрыты выполненной профильной suite. Это не ручное заполнение сотен полей браузером и не проверка физического принтера.

### Backend и приватность

Новые uploads и PDF используют private storage вне `MEDIA_ROOT`; download через staff + `leads.view_lead` и object permission, `private, no-store`, attachment/nosniff. Доступ без прав и отсутствие файла проверены. Логи содержат ID/коды/тип исключения, не ответы/контакты. Ошибки storage/транзакций вызывают cleanup; падение между записью файла и DB всё ещё может оставить orphan — предусмотрен `audit_questionnaire_files` dry-run. Зачистка файлов в этом аудите не запускалась.

Публичный endpoint имеет body/parser/file limits и отдельный IP limiter до parsing/hash. Storage limiter — один закрытый SQLite-файл на одном хосте; при отказе fail-closed 503. Trusted CIDR/X-Real-IP/Unix opt-in не равны доверию произвольному X-Forwarded-For. Реальные peer/topology и права каталогов сервера неизвестны. Distributed bots и общая квота очереди/диска этим limiter не решаются; мониторинг обязателен, отсутствие Redis само по себе не дефект.

Исторический `Lead.attachment` может оставаться публичным до отдельного verified переноса и закрытия старой раздачи. Наличие management command **не доказывает**, что перенос выполнен на сервере. Тесты legacy migration прошли на штатном SQLite; полная PG suite ограничена A06. Для реальных данных нужен dry-run/verify на копии и план восстановления.

### Архитектура и сопровождение

Данные каталога централизованы; UI/API/analytics разделены; общая versioned схема используется UI и backend; PDF renderer/очередь/Admin отделены. Отложенный editor не создаёт второй draft. Эффекты редактора снимают observers/обработчики, поздний import не меняет unmounted state; singleton capability — одноразовая проверка, повтор перед отправкой защищает контракт. При первоначальном отказе capability UI не перепроверяет его сам в этой вкладке до reload; черновик сохраняется, но File при reload надо выбрать заново. Это ограничение восстановления UX, не потеря уже принятой заявки.

Увеличение сложности оправдано устойчивыми ОЛ и приватными файлами. Не обнаружены новые runtime mocks/debugger/тестовые hooks в production bundle. Старые docs/снимки — исторические материалы, не неиспользуемая бизнес-логика. Реальные затраты сопровождения: много специальных scroll-состояний, фиксированный перечень схем и два worker-пути; A03/A05/A06 — конкретные проявления, не повод переписывать архитектуру целиком.

## 6. Интерфейс и доступность

Проверены Chromium/Linux, desktop и mobile viewport, reduced-motion emulation. Размер окна 900 px по высоте в собственном обзоре; в существующих regressions есть resize клавиатуры/текста/шапки. **Реальная клавиатура мобильного устройства, Safari/Firefox, VoiceOver/NVDA не проверены.**

На всех 6 заданных ширинах осмотрены снимки обычной формы и включённого ОЛ; главная, about, документы осмотрены на 360/1440. Остальные route/width комбинации проверены DOM/геометрией, а не объявлены полноценно визуально принятыми. [360 px форма — внешний артефакт](release-handoff-external-artifacts.md), [1440 px форма — внешний артефакт](release-handoff-external-artifacts.md), [390 px ОЛ — внешний артефакт](release-handoff-external-artifacts.md), [1440 px ОЛ — внешний артефакт](release-handoff-external-artifacts.md), [документы — внешний артефакт](release-handoff-external-artifacts.md), [about — внешний артефакт](release-handoff-external-artifacts.md).

Не найдено горизонтального переполнения, обрезания форм/ссылок или ошибок консоли в 48 проверках. На mobile форма длинная, но прокручивается страницей; отсутствие всей формы в одном viewport не считается дефектом. Desktop имеет внутренний scroll ОЛ. Документы скачиваются реальным browser download с проверкой хеша; сертификаты/СОУТ открываются отдельно. Кейсы: modal metadata, backdrop/close и возврат фоновой страницы проверены существующим browser suite; полного ручного перебора всех слайдов каждой галереи в шести ширинах не было.

Axe выявил настоящие ограничения: мелкий белый текст на `#f97316` имеет **2,8:1**, оранжевый на светлом фоне местами **2,52–2,57:1**, вместо 4,5:1. У `.file-select__input` нет accessible name, хотя соседняя кнопка выбора названа. Это visually-hidden, но не `display:none` input; автоматическое замечание не снимается одним именем соседней кнопки. `/documents` в выбранных состояниях не имеет автоматических нарушений; это не сертификат доступности сайта. Клавиатурные сценарии cookies, policy, clear, file controls, editor и focus covered частично browser regressions; ограничения A03 сохраняются.

## 7. Быстродействие production-сборки

Полный dist **24 554 886 B** включает публичные документы и все responsive variants; это **не вес загрузки одной страницы**. Main JS **515 280 B / gzip 137 110 B**, policy **3 550 / 1 642 B**, CSS **104 034 / 19 839 B**, deferred QuestionnaireEditor **10 337 / 4 043 B**. Gzip рассчитан одинаковым алгоритмом для сравнения артефактов; настоящий локальный nginx fixture здесь отдаёт их **без gzip**. Предупреждение Vite >500 kB не подавлялось.

У новых 27 about-photo — WebP, 3 srcSet, width/height и lazy; большие JPEG из `gallery-source` не копируются в dist. Однако требование «никаких тяжёлых исходных фото» не выполнено для всего сайта: `service-design-hero-*.jpg` **1 535 785 B** публичен и реально загружается на `/services/design`. Это унаследованный asset, без сопоставимой прежней сборки **регрессией не объявляется**. Большие публичные PDF до 2,09 MB загружаются по запросу документа; их размер не равен первичной загрузке главной.

Лаборатория: Chromium 154, **390×900**, cold cache/new context, CPU slowdown **4×**, latency **100 ms**, download **200 000 B/s**, upload 100 000 B/s; local nginx без gzip, аналитика flag-off, внешняя сеть блокирована. Три прогона каждой страницы; LCP после networkidle +700 ms. Измерения браузера, **не Lighthouse score и не полевые Web Vitals**.

| Страница | LCP, три прогона, ms | CLS | Наибольшая long task, ms | Resource transfer, B |
|---|---|---|---|---:|
| `/` | 2212 / 2268 / 2372 | 0,000134 | 117 / 181 / 176 | 1 603 343 |
| `/services/design` | 11980 / 11992 / 11980 | 0,001564 | 140 / 199 / 162 | 2 361 957 |
| `/solutions/btp` | 5140 / 5140 / 5140 | 0,000134 | 164 / 119 / 117 | 1 210 884 |

Слабое место — прежде всего картинка проектирования и загрузка общих ресурсов на медленной сети. Не обещается такое же время в production: там неизвестны gzip/Brotli/CDN/cache/оборудование. Небольшой CLS в этих сценариях не гарантирует отсутствие всех сдвигов. Полевой INP не измерен; numeric input/редактор/route interactions функционально проверены, но выводов об INP percentile нет. Нужны целевой staging и полевые данные после публикации. Отдельная сборка analytics flag-on использована для функциональных mocks, её влияние на реальные production timings не измерялось.

## 8. SEO, содержание и поиск с ИИ

### Текущий проект

Фактический реестр: `/`, `/about`, `/documents`, `/solutions`, пять `/solutions/:slug`, `/services`, три `/services/:slug`, `/cases`, пять подробных `/cases/:slug`, `/privacy` — **20 страниц**. `/404` — служебный артефакт, не 21-я индексируемая страница; `/contacts` — 301 на `/#contacts` с query. ОЛ — состояния формы, не отдельные indexable URL. 14 файлов документов — ресурсы, не дополнительные HTML-страницы sitemap. `analytics-frame.html` — служебный noindex.

Свежий HTML/HTTP/browser подтвердили собственные title/description/canonical/H1, Organization и согласованный с видимыми ответами FAQPage, sitemap/routes/include одной сборки, 404 без canonical, query/hash поведение и отсутствие blanket SPA 200 для неизвестных страниц. PDF/XLSX отдаются правильными MIME, HEAD и хешами; неизвестные документы — настоящие 404. Без JS содержание доступно, форма disabled с объяснением; hydration не подменяет содержательный HTML пустой оболочкой. Тест nginx использует **пример**, а не живой vhost. Нельзя переносить результат на конфликтующие location в production.

Содержательные задачи разделены: БМК — источник тепла; БТП — тепловой узел/системы объекта; ВНС — водоснабжение; ПНС — противопожарный проект; шкафы — автоматика; проектирование/СМР/ПНР — различные этапы работ. Описания, исходные данные, FAQ, CTA и документы позволяют понять применимость и обратиться. Catalog overview и detail имеют разные роли, совпадение терминов не доказывает каннибализацию. Общая структура мета похожа, но конкретные изделия/услуги различимы; доказанного основания переписывать 8 текстов нет.

Есть ссылки каталоги ↔ детали, детали ↔ кейсы/общая форма, документы ↔ бланки, видимая ссылка документов в футере и рядом с редактором. Сертификаты не объявлены сертификатами на каждое изделие: незаполненные категории реестра скрыты, заглушек нет. Кейсов 1 БМК и 4 БТП; отсутствие кейса на каждую услугу/изделие не заполнять выдумкой. Контакты в HTML согласованы: `+78004440766`, `sales@ee-don.ru`; PDF генератор использует те же контакты. Документ ТЕПЛОСИЛА действует до **31.12.2026**, ТЕСС — до **29.06.2030** по извлечённому тексту. Часть сертификатов — сканы, их текстовый поиск/актуальный статус партнёрства независимо не проверены; напоминание об истечении ТЕПЛОСИЛА полезно. Подлинность документов по файлу не устанавливается.

### Опубликованный сайт и кабинеты

3.11.2026 GET `/`, `/robots.txt`, `/sitemap.xml` на публичном домене заблокирован CONNECT 403 политики среды. Это **не дефект сайта и не наблюдение доступности роботов**. Ни поисковые результаты, ни фактическая индексация, ни свежесть production-контента не установлены. Доступ к Яндекс Вебмастеру, Search Console и Метрике/выгрузкам не предоставлен. Отсутствие данных не означает отсутствие трафика или проблем.

Нужны минимальные обезличенные выгрузки:

1. Яндекс Вебмастер: индексируемые/исключённые URL с причинами, обход/ошибки, sitemap; запросы × URL с показами/кликами/CTR.
2. GSC: Page indexing, Sitemaps, URL Inspection выборки главной/изделия/услуги/documents, выбранный canonical; Performance Search results по запросам/страницам/странам/устройствам.
3. Периоды сравнения: **06.10–02.11.2026** и **08.09–05.10.2026** (по 28 полных дней); отдельно брендовые/небрендовые, регион/устройство. Это исходный baseline старого опубликованного сайта, не результат непубликованной ветки.
4. Метрика дополнительно: источники/посадочные/успешные обращения за те же даты, без сырых персональных данных. Цели не заменяют отчёт об индексации.

### Реальная видимость ИИ и официальные условия

**Не выполнена**: доступного инструмента/авторизованного UI Алисы, ChatGPT Search или ГигаЧата в этой сессии нет. Обычный web search вместо этих ответов не запускался и не выдаётся за их результат. [Фиксированный набор 16 запросов и протокол](release-readiness-search-protocol.md) подготовлен для владельца **до будущих выполнений**. Ни одно упоминание/цитирование не заявляется.

Официальные справки OpenAI `https://platform.openai.com/docs/bots`, Яндекса `https://yandex.ru/support/webmaster/robot-workings/check-yandex-robots.html`, ГигаЧата `https://developers.sber.ru/docs/ru/gigachat/overview` пробовались **03.11.2026**, но заблокированы; актуальная редакция требований **не прочитана и не подтверждена**. До изменения robots/CDN владелец должен сверить первичные справки: поисковый crawler, user-triggered retrieval и обучение — разные назначения, когда сервис их разделяет. Точные актуальные User-Agent/IP списки без чтения справки здесь не выдумываются.

Локальный `robots.txt`: `User-agent: *`, Allow `/`, Disallow `/admin/` и `/api/`, sitemap на каноническом домене. Он не является управлением доступом к private storage. На реальном хосте robots/CDN/WAF могут отличаться; настоящие логи роботов и подтверждённые диапазоны не доступны. Подстановка User-Agent не выполнялась и не считалась доказательством crawler access. `llms.txt` не объявляется обязательным, автоматического открытия доступа всем роботам не предлагается.

Для новой версии порядок: публикация → подтверждённый повторный обход/индексация → повтор тех же запросов/условий. Наличие готового HTML, разрешение обхода, индексирование и цитирование ИИ — разные результаты. Ни фиксированный срок появления в Алисе, ни «включение в базу ИИ» не обещаются. Отсутствие компании в отдельных ответах или низкий CTR сами по себе выпуск не блокируют.

## 9. Метрика и атрибуция

Включение только при production build + точном `VITE_EE_ANALYTICS_ENABLED=true` + HTTPS и hostname `energoeffekt-rostov.ru`/`www...` + аналитическом согласии. Default flag-off; localhost/staging не запускают счётчик. Consent 180 дней, attribution 30 дней, технический retry 24 часа. Отказ/отзыв не стирают обычный draft, удаляют факультативную attribution/останавливают счётчик. First/last и UUID восстанавливаются по проверенным правилам; поздний callback после revoke не оживляет прежний контекст.

7 разрешённых целей: `lead_success`, `contact_phone_click`, `contact_email_click`, `lead_form_start`, `document_selected`, `calculation_cta_click`, `case_open`. **Отдельной `questionnaire_success` и параметра состава ОЛ нет**: успешная заявка с ОЛ входит в `lead_success`; путь через разные ОЛ не измеряется отдельно. Это измерительная возможность P2, а не доказанная потеря заявки/ошибка общего счётчика. Direction — контекст обращения, полный принятый состав — backend snapshots.

Mock-проверки подтвердили отсутствие дублей SPA-hit/успеха retry, запрет replay после отзыва, отсутствие имен/контактов/файловых имён/UUID в analytics payload. Allowlist campaign codes снижает риск произвольного текста, но синтаксис кода не гарантирует отсутствие ПД по смыслу: подрядчик должен использовать согласованные неперсональные UTM. Реальный `tag.js`, CSP/TLS production, настройки кабинета и принятие событий не проверены; успешный mock не доказывает получение цели Яндексом.

## 10. Реестр замечаний

P0 — критическая угроза данным/работе; P1 — условие допуска к выпуску; P2 — допустимо отложить с явным объяснением; P3 — необязательное улучшение. В таблице отдельно указана природа доказательства. **Не найдено воспроизведённого P0.**

| Приоритет | Проблема | Сценарий и последствия | Доказательство | Рекомендуемое исправление | Блокирует обновление? |
|---|---|---|---|---|---|
| **P1 A01** | Незакрытый security-review runtime pins Django 5.2.13 / DRF 3.17.1 / sqlparse 0.5.5 | Advisory совпадают с установленными версиями; среди DRF — unauthenticated Accept negotiation DoS. `super().initial()` выполняет negotiation **до** локального POST limiter; GET тоже проходит negotiation. Реальная достижимость и предел ущерба зависят от nginx/Gunicorn header limits | pip-audit exit 1; [23 уникальных ID — внешний артефакт](release-handoff-external-artifacts.md), `backend/apps/leads/views.py:33`, DRF negotiation. [GHSA-33wh-fxxf-88vv](https://github.com/advisories/GHSA-33wh-fxxf-88vv) | Отдельной задачей обновить поддерживаемые runtime версии и прогнать регрессию, либо документировать неприменимость/достаточную защиту **каждого достижимого** advisory. По данным сканера нижние исправленные ветки: Django 5.2.17, DRF 3.18.2, sqlparse 0.6.0; совместимость обновлений ещё не тестировалась | **Да, до security disposition.** Это подтверждённое совпадение advisory и открытый путь, не воспроизведённый взлом/DoS production |
| P2 A02 | ОЛ-only draft очищается без подтверждения | Открыть ВНС, включить ОЛ, заполнить поле, не трогать контакты, нажать «Очистить форму»: dialog не появляется, ответы удаляются | `LeadForm.jsx:84–91`: nonempty не учитывает questionnaires; [probe](release-readiness-evidence/questionnaire-clear.json) | В отдельной правке учитывать данные/включённые ОЛ в nonempty; проверить cancel/confirm для OL-only | Нет: требуется явное нажатие очистки, автоматической потери принятого/обычного draft нет. Желательно исправить до приёмки |
| P2 A03 | Частичная доступность: контраст, file label и reduced-motion | Мелкий orange/white текст 2,5–2,8:1; нативный input не назван; `entryScroll` игнорирует reduce и анимирует 2,2 с | [axe](release-readiness-evidence/accessibility.json); FileSelect.jsx:155; ScrollToTop.jsx:282; [motion probe](release-readiness-evidence/reduced-motion.json) | Назвать file input, скорректировать цвета конкретных элементов без полной смены дизайна, отключать JS scroll animation при reduce | Не функциональный блокер при текущем ТЗ; нельзя заявлять полное WCAG AA. При обязательном AA приоритет поднять |
| P2 A04 | Тяжёлый hero проектирования и общий JS | JPEG 1,54 MB реально запрашивается, LCP около 12 с при фиксированной медленной сети; main 515 kB raw | [bundle](release-readiness-evidence/bundle.json), [9 прогонов](release-readiness-evidence/performance.json), `data/services.js:14` | Responsive WebP/AVIF для конкретного hero, затем повторить замеры на gzip/Brotli staging; общий code split — по измерениям | Нет: работа не ломается; высокая ценность ближайшей оптимизации, без заявления регрессии |
| P2 A05 | Старый deploy README содержит опасно общий итог «backend не меняет/миграции не нужны» | Использование только `deploy/README.md:42–43` для всей ветки пропустит 0008–0010, contract и worker | Сравнение с `backend/docs/electronic-questionnaires-release.md` и фактическими migrations | Уточнить область старого текста отдельной документационной правкой; для этого выпуска использовать последовательность §11 и новый questionnaire runbook | Сам текст — нет, **пропуск backend/migrations/worker — да**. В этом отчёте обязательный порядок уже указан |
| P2 A06 | Полная test suite не переносится на PostgreSQL без исправления harness | TestCase/APITestCase держат outer atomic; close_old_connections/явный response.close закрывают PG connection, в in-memory SQLite закрытие игнорируется; последующие проверки получают connection closed | Полная PG suite: 1 failure/23 errors; standalone worker TestCase тоже падает; 25 профильных PG tests и runtime worker вне TestCase проходят | Отдельно исправить тестовую обвязку: TransactionTestCase/корректный lifecycle для management commands/streaming, без удаления assertions. Повторить полную suite | Не подтверждённый runtime-блокер; ограничение регрессии явно принять. Не выдавать полную PG suite за успешную |
| P2 A07 | Advisory dev tree Vite/ESLint/zod/minimatch | npm audit: 8 пакетов; Vite launch-editor/path restrictions, zod resource exhaustion, minimatch DoS. Vite не должен быть публичным production server | [npm audit](release-readiness-evidence/npm-audit.json): 2 high/6 moderate. [Vite GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | Отдельно обновить dev lockfile/инструменты, повторить build/lint/tests; не публиковать dev server. Не применять `npm audit fix --force` вслепую | Нет для static dist за nginx; да для небезопасного открытого Vite workflow |
| P2 A08 | Измерение ОЛ не выделено из общего обращения | Нельзя отчётом по текущей цели различить успешные ОЛ/обычную заявку/состав ОЛ | `analytics/policy.js:69`, `runtime.js` только общий `lead_success` | По согласованию с подрядчиком ввести конечный неперсональный тип обращения/цель, не ответы и не ID. Отдельная задача | Нет; общая конверсия работает в mock, кабинет всё ещё не проверен |
| P3 A09 | Срок сертификата/актуальность документации | ТЕПЛОСИЛА заканчивается 31.12.2026; intro root/backend README содержит прежние количества/этапы | PDF/text extraction, текущие vs исторические docs | Владелец подтверждает актуальность/продление; затем точечно актуализировать entry docs | Нет на дату аудита; не выдумывать новое подтверждение |

Отдельные **непроверенные условия**, а не установленные дефекты: целевой SHA/runtime, действующие конфиги nginx/Gunicorn/CDN/WAF, реальные migrations, historical public media, backup/restore, supervisor/queue monitoring, SMTP delivery, CSP и кабинет Метрики. Они обязательны для допуска конкретного окружения к обновлению. Нет оснований заявлять утечку исторических файлов без обследования сервера; нет оснований объявлять их приватными только по текущему коду.

Advisory triage: не все записи применимы. GeoDjango не установлен, shared cache middleware отсутствует, SMTP вызывается с `fail_silently=False`; JSON parser публичной формы заменён bounded form/multipart parsers, authtoken не подключён. Это снижает применимость конкретных GIS/cache/JSON/TokenProxy advisory, но не закрывает общую negotiation issue. Пределы nginx/Gunicorn header нужно проверить на реальном хосте. Агрессивный DoS/эксплуатация не запускались. Повторные PYSEC-записи одного ID в PyPI не посчитаны как отдельные дефекты.

## 11. План внедрения, приёмки и отката

Это **план следующего согласованного этапа**, а не команды для исполнения сейчас. SSH, production migrate, перенос файлов, restart/reload и deploy в аудите не выполнялись.

1. **Зафиксировать артефакт выпуска.** Проверенный `8514af5...` — исходная точка. После A01 и любых исправлений получить новый полный SHA, обновить этот результат целевыми regressions. Проверить реальный серверный SHA и topology; различие main/feature не устранять слепым merge/reset. Зафиксировать runtime Python/Node/PostgreSQL/Gunicorn, Linux/DejaVu/subprocess/resource и способ установки web runtime.
2. **Обследовать и зарезервировать.** Снять защищённые backup БД, public media и private storage, конфигов, EnvironmentFile и полного предыдущего dist (секреты остаются на сервере). Проверить восстановление в отдельную среду и согласованность backup БД/файлов. Установить объём диска/каталогов/temp/очередей и владельцев; не выдавать world-write. Без проверки восстановления не включать новую приёмку ОЛ.
3. **Согласовать env и совместимость.** Сохранить действующие `DJANGO_SECRET_KEY`, DB_*, mail, host/CSRF, trusted peer, private/rate paths и ordinary notification mode. Новое: точный backend `QUESTIONNAIRES_ENABLED=False` на время подготовки; `QUESTIONNAIRE_FONT_PATH`; лимиты `QUESTIONNAIRE_MAX_ITEMS=4`, `MAX_OUTLETS=100`, `MAX_BYTES=262144`, `MAX_TEXT=2000`, `MAX_PDF_BYTES=5242880`, `MAX_ATTEMPTS=3`, `PDF_TIMEOUT=45`. Пять последних имён также с префиксом `QUESTIONNAIRE_`. Пределы сверить с frontend contract, nginx body и почтовым MIME budget. Префиксы/логические значения case-sensitive: backend `True`, frontend analytics `true`.
4. **Сначала backend и данные.** Полный release должен содержать **`contracts/questionnaires/v1` вне ee_site/backend**, requirements и шрифт. После approved backup просмотреть полный migration plan и применить до leads **0010**; не ограничиваться 0007 и не удалять таблицы при откате. Проверить ранее существующие строки, private storage и миграцию historical attachments на копии; dry-run/apply/verify выполняются отдельным согласованным этапом, затем закрывается публичный источник. Schema migrate не переносит файлы сам.
5. **Worker и безопасная приёмка.** Подготовить один supervised `process_questionnaires --continuous --limit 10 --interval 5` под тем же пользователем, settings/env/venv/БД/private root, что web. Проверить actual unit paths, stop grace ≥60 с, limits, restart/logs/monitoring pending/retry/intervention/uncertain и свободное место. Ordinary `process_lead_notifications` нужен только при background; он исключает questionnaire jobs. Проверить readiness с флагом подготовки, затем совместимость старого frontend с новым backend; включить `QUESTIONNAIRES_ENABLED=True` лишь после подтверждения worker. Capability=true сам по себе не доказывает живой worker.
6. **Полный frontend и nginx.** `npm ci --include=dev`, test/lint/build/prerender с одинаковыми VITE variables. Для same-origin `VITE_API_BASE_URL=''`; `.env` production build не читает. Analytics оставить false до отдельной юридической/кабинетной приёмки. Versioned dist должен содержать все 20 HTML+404, hashed assets, 14 документов, frame, robots/sitemap и generated include. Root и include переключаются одной версией. **Не заменять живой nginx шаблоном.** Слить только совместимые location: документы, prerender/404/redirects, API/admin/static/media/private boundaries; `nginx -t` до approved reload. Проверить унаследованные CSP/security headers, HTTPS/www, query-preserving 301, реальные unknown 404, MIME, cache policy, body limits, JSON errors и Retry-After. `proxy_intercept_errors` не должен превращать API JSON в HTML. API/private/Admin не кешировать; HTML должен обновляться, immutable hashed assets — только с версионным именем. Предыдущие JS/CSS chunks сохранить на срок перехода уже открытых вкладок.
7. **Контролируемая приёмка целевого окружения.** Сначала read-only все URL/файлы/no-JS/404/headers. Затем отдельно разрешённая синтетическая обычная заявка и 2–4 ОЛ с файлами; проверить DB snapshots/job, protected download/права, PDF/кириллицу, one retry ID и отсутствие лишнего письма. Получение письма адресатом проверить отдельно: 201 означает commit, `sent` — принятие почтовым backend, не доставку в inbox. Проверить отказ/отзыв consent, форму, reload/SPA/Back/Forward и старую открытую вкладку. Метрику включать отдельной production-сборкой после согласования и проверки семи целей/кабинета; не посылать реальные цели из тестовой сессии.
8. **Наблюдение и критерии остановки.** Отслеживать 5xx/429/503, pending age, generation failures/intervention/uncertain, storage/диск/latency, API contract mismatch, private access и пропавшие chunks. Стоп/откат при потере payload/PDF/прав доступа, повторных письмах, невозможности восстановления очереди, массовых hydration/404/5xx. Сначала выключить новую приёмку ОЛ и сохранить доказательства, не чистить очередь.
9. **Откат с сохранением новых данных.** Вернуть предыдущий полный frontend dist и совместимый vhost/root/include вместе; сохранить старые hashed assets. После принятия первой ОЛ **не возвращать backend к коду без схем/worker и не reverse 0008–0010**: новый backend/storage/очередь оставить для уже принятых работ. При неисправном renderer остановить только questionnaire worker, сохранить snapshots, устранить причину и продолжить. `sending/uncertain` расследовать по SMTP прежде чем resend. Восстановление старого dump поверх новых заявок недопустимо без reconciliation; rollback плана должен заранее учитывать все записи после cutover.

### Безопасная исходная инвентаризация владельцем

Только на уже известном сервере, без отправки `.env`/секретов и без изменения конфигурации. Аудитор это **не выполнял**. Выполнять из фактического checkout/venv, не угадывать пути из исторических README:

```sh
git rev-parse HEAD
git branch --show-current
git status --short
python --version
node --version
nginx -v
nginx -t
psql --version
python -m pip show Django djangorestframework psycopg gunicorn reportlab
systemctl show ACTUAL_WEB_UNIT ACTUAL_QUESTIONNAIRE_UNIT --property=User,Group,WorkingDirectory,FragmentPath,ActiveState,SubState
python manage.py showmigrations --plan --settings=config.settings.prod
python manage.py migrate --plan --settings=config.settings.prod
python manage.py lead_notification_status --settings=config.settings.prod
python manage.py resolve_questionnaire_job --settings=config.settings.prod --lead SYNTHETIC_OR_REDACTED_ID
```

Последняя команда **без decision** read-only и нужна только при существующем диагностируемом job. Если текущий серверный код её не содержит, не устанавливать код ради инвентаризации. Вывести наличие нужных переменных можно как `name: set/unset` из уже загруженного окружения службы; не выполнять dump env и не присылать EnvironmentFile, `nginx -T`, полные systemd unit/journal или contact-bearing DB rows без обезличивания. Для nginx нужны выбранные обезличенные location/headers/cache/body/proxy директивы и согласованный owner snapshot, а не полный конфиг с возможными секретами. Для прав нужны владельцы/mode **известных** private/rate/temp путей, для БД — версия/план/агрегированные counts без answers/контактов.

Readiness probe, dry-run/apply миграции файлов, backup/restore, синтетическая отправка и service restart — следующий согласованный этап; они не названы read-only инвентаризацией.

## 12. Не более пяти ближайших действий

1. Отдельной задачей закрыть **A01**: проверить применимость runtime advisory, обновить/обосновать версии и повторить тесты на новом SHA.
2. Получить обезличенную серверную инвентаризацию: реальный SHA/runtime/migrations, nginx/proxy/private/rate, worker/SMTP, backup и результат восстановления.
3. Принять текущий визуальный пакет; решить A02/A03/A04 и отдельно исправить PostgreSQL test harness. Отложенные R1–R5 не открывать без новой необходимости.
4. Подготовить staging по §11 и выполнить разрешённую приёмку ordinary+ОЛ, protected files, queues, rollback/старых chunks; только затем решать о контролируемом production cutover.
5. Получить поисковые выгрузки и выполнить фиксированный протокол ИИ/поиска; повторять после подтверждённого обхода новой версии, без обещания сроков/позиций.

## 13. Что создано аудитом и что осталось неизменным

В исходном checkout созданы **только** этот отчёт, `release-readiness-search-protocol.md` и каталог `release-readiness-evidence/` (логи/JSON/снимки/диагностические runners). README, прежние аудиты, приложение, тесты, зависимости, lockfiles и настройки не изменялись. Временные инструменты/кластеры/settings находятся вне checkout. Ветка/HEAD рабочего checkout сохранены; commit/push/PR/merge/deploy не выполнялись. Серверные команды не исполнялись. Фактический конечный `git status` и перечень созданных файлов зафиксированы в приложении `working-tree-status.txt`.
