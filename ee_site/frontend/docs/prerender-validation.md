# Проверка build-time prerender ЭЭ

Дата: **11 октября 2026**. Ветка `feature/ee-prerender`, база
`d174255f9a2dcf3aeaea068c609fba577b7eea94` — актуальный main с merge PR #48
сохранения черновика заявки. До начала `git status --short` был пуст;
`git ls-remote origin refs/heads/main` подтвердил тот же SHA. Пользовательские
изменения не перезаписывались. Commit/push/PR/merge/deploy/production migrate
не выполнялись. Backend и тексты data не менялись.

## Решение

Vite сначала собирает клиент, затем временный Node renderer существующего
`App` с `StaticRouter`. `renderToString` создаёт HTML; `SeoBuildContext`
получает metadata от той же страницы `Seo`, без копирования текстов.
Renderer, временный каталог и SSR bundle удаляются после сборки и не нужны
серверу. В dist попадают плоские HTML-файлы и общий клиентский JS/CSS.
`hydrateRoot` подключает существующее дерево; Vite dev с пустым root продолжает
использовать `createRoot`. SPA-навигация и memory-only store остаются прежними.

`src/prerender/routes.js` объединяет основные страницы с URL из products,
services и cases (`hasDetailPage`). Он формирует HTML, итоговый sitemap и
`prerender-routes.conf`. Ручной `public/sitemap.xml` удалён: второй список больше
не нужен. При новых data-объектах обязательно согласовать slug/url/Seo и ссылки;
build диагностирует несовпадение path, неизвестные ссылки и duplicate routes.
nginx-шаблон включает именно конфигурацию из того же полного dist.

Единственная новая зависимость — **parse5 8.0.0**, dev-only HTML parser с
зафиксированной версией/lockfile: проверяет фактическую структуру HTML, metadata,
внутренние ссылки, JSON-LD и изоляцию формы. React/Vite/router уже были в проекте;
браузер для генерации не требуется. Playwright/nginx остаются внешними test tools.

## Изоляция и готовность формы

Для каждого render создаётся новое React-дерево, новый SEO collector и чистый
router location без query/state. SSR snapshot черновика пуст и не читается из
пользовательского store. Эффекты не запускаются; window, storage и browser
контекст отсутствуют. Сборка получает пустой envDir, не читает production `.env`;
неожиданный fetch выбрасывает ошибку. Генерация не отправляет заявки и не
загружает счётчик. Проверены сборки с default off и process flag true.

Поля/документы/submit блокируются fieldset до завершения hydration; ready-hook
возвращает false и на сервере, и на первом клиентском render. Разрешённый ранний
ввод не стирается, потому что ввод до готовности не разрешён. `method=post` и
submit guard исключают обычный GET с контактами в URL. Без JS есть явное
пояснение; текст и ссылки работают, FAQ/подробности изделия раскрыты CSS из
noscript. В HTML нет открытого cookie UI, visitor consent, полей/файлов,
retry UUID, campaign attribution, ошибок/успеха или modal. Cookie UI появляется
по действующему согласию только после hydration. Политика остаётся `/privacy`;
`?from=lead-form` добавляет прежнее пояснение после готовности, не меняет canonical.

## Маршруты: фактический локальный nginx

Все строки проверены HTTP-source до JS, direct/reload после JS и без JS.
Meta означает уникальные title/description, canonical без query/hash, robots,
OG/Twitter. Organization присутствует на всех страницах; FAQ — на применимых
8 страницах изделий/услуг, с теми же вопросами/ответами в HTML. Внутренние ссылки
проверены по реестру. Полезный текст один и тот же для посетителей и роботов.

| URL | HTTP direct/reload | Исходный HTML | После JS | HTML, байт |
| --- | --- | --- | --- | ---: |
| `/` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 37276 |
| `/about` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 13588 |
| `/solutions` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 18084 |
| `/solutions/bmk` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 36039 |
| `/solutions/btp` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 35939 |
| `/solutions/vns` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 36170 |
| `/solutions/pns` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 36329 |
| `/solutions/automation-cabinets` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 35955 |
| `/services` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 14608 |
| `/services/design` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 38462 |
| `/services/construction-installation` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 38856 |
| `/services/commissioning` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 38038 |
| `/cases` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 17553 |
| `/cases/bmk-sports-complex` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 15934 |
| `/cases/btp-food-production` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 15937 |
| `/cases/btp-hotel-complex` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 16077 |
| `/cases/btp-residential-complex` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 16365 |
| `/cases/btp-industrial-facility` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 16161 |
| `/privacy` | 200 / 200 | текст, H1, ссылки, meta, JSON-LD | hydration, собственные meta | 24152 |

| Остальные запросы | Результат |
| --- | --- |
| неизвестная страница/изделие/услуга/кейс, старые неподтверждённые URL, неверный регистр | 404, читаемая ошибка, noindex, без canonical/og:url и masking redirect |
| `/contacts`, `/contacts/` | 301 на `/` с прежним query и `#contacts` |
| `/index.html` | 301 на `/` с query |
| trailing slash известных страниц | 301 без slash, query сохранён |
| прямые generated `.html`, manifest/include | 404, нет второго канонического адреса/публичного config |
| assets, robots, sitemap, analytics-frame | 200; отсутствующий asset — 404 |
| API/admin sentinel ошибки | прежний JSON и 429/401/404, Retry-After=17 сохранён |
| server headers, включая internal 404/frame | наследуются; local add_header не добавлялся |

## Команды и фактические результаты

Рабочая директория — `ee_site/frontend`. Проверено на Debian 13,
Node 24.19.0/npm 11.9.0, nginx 1.26.3, Chromium 154.0.8037.57,
внешнем Playwright 1.58.2. Пути внешних test tools передавались через
`NGINX_BIN`, `NGINX_MIME_TYPES`, `PLAYWRIGHT_MODULE`, `CHROME_PATH`.
Никакого обязательного `/workspace`, `/tmp` или browser path в build нет.

| Команда / сценарий | Результат |
| --- | --- |
| `npm ci` (до изменения зависимостей), установка exact parse5 и lockfile | успешно |
| `npm test` | 40 passed, 0 failed/skipped |
| `npm run lint` | успешно |
| `npm run build` | 19 публичных HTML + 404; обязательная проверка всех output; успешно |
| `npm run test:prerender` | 5 passed; content/metadata/isolation и отрицательные примеры |
| `SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs` | 7 passed: 6 HTTP групп + SEO/no-JS/delayed-JS/privacy browser runners |
| `node scripts/technical-seo-browser.mjs` (в fixture) | 7 групп: все маршруты, head/schema, 404, SPA/Back/Forward, modal, aliases, responsive |
| `node scripts/prerender-browser.mjs` (в fixture) | 4 группы: все 19 без JS и delayed JS, 360/1440 px |
| `node scripts/privacy-form-browser.mjs` (в fixture) | 4 группы, 360/1440 px, поля и документы в исходной вкладке, canonical/analytics |
| `DRAFT_DIST=<enabled-dist> node scripts/lead-draft-browser.mjs` | 20 групп, 360/1440 px: поля/тема/файлы/consent, clear, retry/ошибки, lock, success timers, tabs/reload |
| `QUALITY_URL=<local-nginx> node scripts/browser-quality.mjs` | 53 групп: gallery/focus/Escape/scroll, switcher/resize/Back/Forward, формы и desktop/mobile |
| `VITE_EE_ANALYTICS_ENABLED=true npm run build` | успешно, тот же набор чистых HTML, counter не запускался при генерации |
| `ANALYTICS_DIST=<enabled-dist> node scripts/analytics-browser.mjs` | 23 группы, intercepted mock counter и отдельный локальный PostgreSQL/Django API; consent/revoke, dedup, delayed load, hostname gate, UUID/retry, ошибки; 0 page errors |
| `ANALYTICS_EXPECT_DISABLED=true node scripts/analytics-browser.mjs` | 1 группа: saved permission на допустимом hostname не включает counter при flag off |
| повторная сборка с stale `removed-route.html` | старый файл удалён |
| удаление detail route в отдельной копии исходников | 18 публичных страниц; исчезли HTML, sitemap и nginx entry удалённого URL |
| принудительная ошибка генерации `/about` в отдельной копии | build nonzero, `/about.html` не подменён оболочкой |
| `git diff --check` | успешно |

API-тесты отправляли только синтетические обращения в отдельную локальную БД;
публичные-looking URL перехватывались до сети. Ни production API, ни SMTP,
ни настоящая Метрика не использовались. Реальный tag.js/доставка в кабинет этим
этапом не подтверждены. Console/hydration errors и horizontal overflow не
обнаружены в итоговых browser runs. Существующие проверки статусов не ослаблены;
ожидание пустого root заменено проверкой реального содержания.

## Сравнение с базой

Базовый frontend взят через `git archive HEAD` в отдельную disposable копию,
без worktree и изменений checkout. Обе сборки проверялись на одной машине;
значения ниже — сырые байты, время одного локального warm run.

| Показатель | До | После |
| --- | ---: | ---: |
| первоначальный HTML главной | 5167 | 37276 |
| весь клиентский JS (включая frame/policy) | 452485 | 453709 |
| CSS | 88427 | 88427 |
| wall time `npm run build`, мс | 932 | 926 |
| содержимое до JS | пустой root | основной текст, ссылки и metadata |

HTML публичных страниц: 13588–38856 байт.
Общий объём HTML артефактов (с 404/frame): 514012 байт.
Геометрия главного H1 до/после delayed hydration одинакова (<1 px) на
360/1440 px; screenshots подтверждают стабильное содержание. После готовности
появляется штатный fixed cookie overlay, он не сдвигает основное дерево.
Это не измерение LCP/полевой скорости; разница времени сборки в пределах шума.
Ускорение, индексация и цитирование ИИ не объявляются. Lighthouse не повторялся:
новых CSS/визуального скачка/ошибок не выявлено, performance claim не делается.

## Короткий Windows-чек-лист

Windows здесь не выполнялся: проверена переносимость Node build, без обязательных
Unix путей, shell-команд и браузерной зависимости. Для независимой проверки:

1. Node 24 (либо совместимый 22.13+), чистый checkout и `npm ci` из frontend.
2. `npm test`, `npm run lint`, `npm run build`, `npm run test:prerender`.
3. Повторить build, проверить manifest: 19 публичных страниц + 404, правильные
   `/about.html` и `/solutions/bmk.html`, собственные meta и пустые disabled формы.
4. PowerShell: `$env:VITE_EE_ANALYTICS_ENABLED='true'; npm run build`;
   после проверки `Remove-Item Env:VITE_EE_ANALYTICS_ENABLED` и default build.
5. Для browser acceptance установить внешние Playwright/Chromium и nginx
   (или использовать WSL), указать NGINX_BIN/NGINX_MIME_TYPES при необходимости.
   `$env:SEO_BROWSER='true'; node --test scripts/technical-seo-http.test.mjs`.
   Проверить no-JS/delayed JS, draft и policy tab на desktop/mobile.

## Ограничения и будущий сервер

Контент статический: при изменении data/slugs требуется полный rebuild.
Временный build SSR не является динамическим runtime; будущая CMS может
потребовать отдельную архитектуру. Без JS форма/галерея/модальные действия не
работают, но прямые страницы и содержание доступны; форма прямо сообщает
необходимость JS. Нельзя публиковать частичный dist после failed build.
Production vhost, caches, TLS/proxy и настоящий counter требуют отдельной
приёмки после разрешённого внедрения. [Порядок внедрения и откат](../../deploy/README.md).

## Изменённые файлы

- Сборка/артефакты: `frontend/package.json`, `frontend/package-lock.json`,
  удалённый `frontend/public/sitemap.xml`, новые `frontend/src/prerender/routes.js`,
  `frontend/src/prerender/entry.jsx`, `frontend/scripts/prerender.mjs`,
  `frontend/scripts/prerender-validation.mjs`.
- Hydration/готовность: `frontend/src/main.jsx`, `frontend/src/api/leadDraft.js`,
  новый `frontend/src/hooks/useClientReady.js`, `frontend/src/components/Seo/Seo.jsx`,
  новый `frontend/src/components/Seo/buildContext.js`,
  `frontend/src/components/LeadForm/LeadForm.jsx`,
  `frontend/src/components/CookieBanner/CookieBanner.jsx`,
  `frontend/src/components/FAQ/FAQ.jsx`,
  `frontend/src/components/ProductDetailsAccordion/ProductDetailsAccordion.jsx`,
  `frontend/src/pages/PrivacyPage/PrivacyPage.jsx`.
- Проверки: новые `frontend/scripts/prerender.test.mjs` и
  `frontend/scripts/prerender-browser.mjs`,
  `frontend/scripts/technical-seo-http.test.mjs`,
  `frontend/scripts/technical-seo-browser.mjs`,
  `frontend/scripts/lead-draft-browser.mjs`, `frontend/scripts/analytics-browser.mjs`.
- Раздача/документы: `deploy/nginx_technical_seo.conf.example`, новый
  `deploy/README.md`, `frontend/README.md`, `frontend/docs/technical-seo-audit.md`,
  новый `frontend/docs/prerender-validation.md` (этот отчёт).

Пути выше относительно `ee_site/`. Полный unified diff, включая новые файлы,
подготовлен отдельно для review; проверена применимость обратного patch к текущему
дереву без изменения файлов. Commit/push/PR/deployment не выполнены.
