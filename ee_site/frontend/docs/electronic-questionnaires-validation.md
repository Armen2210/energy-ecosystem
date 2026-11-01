# Электронные ОЛ: проверка выпуска

01.11.2026, изолированная cloud-среда; основа d3dafac9b703dd26bab0b97cd0b3bb0dd393e7ef.
Реализованы ВНС/ПНС/БМК/БТП. Публичные документы не менялись. Отчёт не означает
merge, deployment, проверку production SMTP или внешней аналитики.

## Фактические результаты

- Node 24.19.0, npm 11.9.0, Python 3.12.14, Django 5.2.13, PostgreSQL 17,
  Chromium, nginx 1.28.0. Зависимости установлены без отключения TLS/signature checks.
- Backend: 127 тестов, 126 passed и один PostgreSQL-only skipped в SQLite suite.
  PostgreSQL-only отдельно **passed**: два параллельных одинаковых запроса дают
  одну заявку; два worker дают один захват и одну отправку локальному mail backend.
- Новая backend suite: 20 тестов, включая все четыре/100×3 выхода, hidden validation,
  идемпотентность, откат данных/файла, crash между PDF, fencing, SMTP uncertain,
  отсутствие снимка, PDF priority, приватный download и immutable contacts.
- Frontend: 50 passed; lint без ошибок; production build — 20 публичных HTML + 404.
  Prerender tests: 8 passed. Build и tests используют одинаковые VITE-переменные.
- Nginx HTTP: 7 passed; combined browser suite — passed. Проверены SEO, no-JS,
  hydration, Back/Forward, policy-tab и все 14 документов (exact bytes/MIME/HEAD).
- Существующий lead-draft-browser: 20 групп passed на 1440/360, обычные заявки,
  файлы, ошибки 400/409/413/429/500/сети, retry id, lock при SHA/POST, очистка,
  сообщения и таймеры. Ожидания обновлены под согласованное хранение session draft.
- Новый browser ВНС/ПНС: реальные действия в редакторе, два ОЛ, hidden jockey,
  выключение/возврат, ШУиА, reload без File, ошибка скрытого ПНС, один real local POST.
- Новый browser four-OL: восстановление общего синтетического fixture, БТП/БМК,
  резерв ТО 49 (ошибка)/70/100, закрытое ГВС и давление ХВ, 100 выходов,
  удаление без переноса данных, явное копирование настроек, один real local POST.
- Ширины: 360, 390, 640, 641, 768, 960, 961, 1280, 1440. Desktop нижние края
  совпадают; mobile без внутреннего vertical scroll. Дополнительно: 961/1440×650,
  10 пользовательских файлов и textarea 300px, текст 200%, keyboard switch,
  horizontal swipe / сохранение vertical и edge gestures, quota fallback.
- Максимальный основной JSON fixture: 109164 UTF-8 байта; все четыре PDF —
  примерно 28–56 КиБ каждый, максимальный БТП 12 A4 страниц, все 300 выходов.
  Отдельный stress-пример: 186409 байт JSON, строки 2000 символов, ID/числа
  по 64 символа и длинное общее сообщение; принят и полностью обработан,
  PDF 30–77 КиБ. HTML-подобный текст печатается экранированным.
  Встроен subset DejaVu Sans, кириллица/единицы/Нет и последние строки сохранены;
  PDF просмотрены визуально, включая последнюю страницу и повторные заголовки.
  Все четыре помещаются в прежний MIME-бюджет. Большие пользовательские файлы
  сохраняются, приоритет PDF и пояснение в письме проверены автоматически.
- Миграции 0008–0010 применены на существующей dev БД; чистая PostgreSQL test БД
  создаётся с ними. Повтор migrate не меняет состояние; makemigrations --check clean.
  Readiness preflight и dry-run audit private files прошли.

## Повторение

Обычные команды из frontend:
```sh
npm ci --include=dev
npm run lint
npm test
export VITE_API_BASE_URL=''
export VITE_EE_ANALYTICS_ENABLED=false
npm run build
npm run test:prerender
```
Backend, из backend с установленным venv:
```sh
.venv/bin/python manage.py test --settings=config.settings.test --noinput
# Только отдельная настроенная local PostgreSQL, не production:
.venv/bin/python manage.py test apps.leads.tests_questionnaire_postgres --settings=config.settings.local --noinput
```

Новые real-API browser runners используют только loopback `5173` и `8000`,
синтетические контакты; остальные назначения блокируются. Для них подготовить
**отдельную локальную** БД/locmem email, QUESTIONNAIRES_ENABLED=True, запустить
Django на 8000 и Vite с VITE_API_BASE_URL=http://127.0.0.1:8000 на 5173.
Не направлять loopback через туннель в production. Установить Playwright внешне,
как в остальных browser runners проекта:
```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROME_PATH=/path/to/chromium node scripts/questionnaires-browser.mjs
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROME_PATH=/path/to/chromium node scripts/questionnaires-four-browser.mjs
```
Снимки — `/tmp/ee-questionnaires-browser`; они и заполненные PDF не в public/Git.
Fixture восстановления в four-runner явно отделён от ручного ввода ВНС/ПНС;
он не выдаётся за ручное заполнение каждого из сотен полей.

Старые browser проверки обычной формы используют синтетический capability=false;
полный новый UI проверяется отдельными runners с реальным backend. Команда
combined suite: `SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs`
с внешними NGINX_BIN/NGINX_MIME_TYPES/PLAYWRIGHT_MODULE/CHROME_PATH.
Lead draft browser использует отдельную same-origin сборку с аналитикой true,
перехватывая все запросы; реальных счётчиков/SMTP нет.

## Перед production

Нужны сверка реальных путей/служб и backup, установка TTF/ReportLab, миграции,
supervised worker, права ответственного сотрудника, включение backend-флага,
полная frontend-сборка и согласованный synthetic smoke на целевом сервере.
Точная последовательность/откат: [инструкция](../../backend/docs/electronic-questionnaires-release.md).
SMTP exactly-once не обещается; uncertain разбирается оператором до resend.
Текущее подключение к production-хостингу не настроено; выпуск туда не выполнялся.
