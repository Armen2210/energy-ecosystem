# Результат реализации и проверки — 09.10.2026

## Summary

Реализованы необязательная Яндекс Метрика 113583806, явное версионированное
согласие/отказ/отзыв, безопасные ручные SPA-просмотры и семь целей, first/last
кампании, структурированное направление, backend validation/admin и техническое
восстановление retry после reload. По умолчанию **выключено**. Идемпотентность,
несколько приватных документов, endpoint protections и очередь сохранены.

Новая миграция `0007_lead_campaign_attribution_lead_direction_slug_and_more.py`:
три ограниченных поля Lead. Применена только к отдельной локальной SQLite DB.
Исторические миграции не редактировались. Account/production/сервер/CRM не менялись.
CA не импортировался, TLS не ослаблялся, production-замеров не было.

## Проверки

Среда: Node 24.19.0, npm 11.9.0, Python 3.12.14, Django 5.2.13,
Playwright 1.64.0, Chromium 151.0.7922.173. Внешние test tools отдельно от
application dependencies. Манифест меняет только команду npm test; lockfile нетронут.

| Команда / сценарий | Результат | Файл результата вне repo |
|---|---|---|
| `npm test` | 31 passed, 0 failed/skipped | `frontend-test.log` |
| `npm run lint` | exit 0 | `frontend-lint.log` |
| `VITE_EE_ANALYTICS_ENABLED=true npm run build` | exit 0 | `build-enabled.log` |
| `npm run build` (default flag off) | exit 0 | `build-disabled.log` |
| backend suite `--settings=config.settings.test --noinput` | 106 passed, 0 failed | `backend-suite.log` |
| `manage.py check --settings=config.settings.test` | no issues | `backend-check.log` |
| `makemigrations --check --dry-run --settings=config.settings.test` | no changes detected | `migrations-check.log` |
| `scripts/analytics-browser.mjs` | 26 browser assertions passed, errors=[] | `browser-final/browser-results.json` |
| Более строгая проверка decoded payload tag.js, invalid document | 3 assertions passed, errors=[] | `browser-real-final/browser-results.json` |
| default build на виртуальном разрешённом hostname с saved allowed | iframe/requests/campaign = 0 | `browser-disabled/browser-results.json` |
| существующий `scripts/browser-quality.mjs` | 53 checks passed, errors=[] | `regression/browser-results.json` |
| `git diff --check` | exit 0 | `git-diff-check.log` |
| полный unified diff, включая новые файлы | reverse apply --check прошёл | `feature-ee-analytics.patch` |

Базовый каталог файлов результатов: `/workspace/ee-analytics-evidence/`.
Рабочие каталоги npm — ee_site/frontend; Django — ee_site/backend.

Браузерные сценарии используют production-сборку, но все публично выглядящие
HTTPS URL перехватываются до TLS/сети и обслуживаются локальными файлами.
API — отдельный Django `http://127.0.0.1:8011`, SQLite, background queue,
private attachments вне checkout. Потеря ответа происходит после фактического
локального создания Lead; retry возвращает реальный duplicate 200. Ни один
POST формы или запрос счётчика не доставлялся в production/Яндекс.

Проверены legacy accepted, zero requests до выбора/после отказа, reload,
переключение/отзыв/повторное разрешение, медленный script и старый callback,
cross-tab отказ и разрешение, storage failure, один init/первый hit, переходы,
Back/Forward, contacts, якоря, case modal/direct, актуальный title, безопасный
unknown URL. Проверены 201 → 200 dedup, потерянный 201 → первый confirmed 200,
новая заявка, 400/409/413/429/500/HTML/network, blocker/исключения, сохранение полей/
документов. Reload/new campaign и revoke/reload сохраняют UUID для ручного retry;
отзыв убирает optional data без 409. В unit tests дополнительно expiry,
валидация/границы UTM, snapshot, legacy hash, technical retry TTL и storage write
failure с readable old choice. Backend: old payload, private uploads, metadata
validation, first-write-wins duplicate, без повторных файлов/jobs, conflict при
изменении содержимого/документов.

Regression widths: 360/390/640/768/960/1440; overflow, галерея, Escape/focus,
клавиатура, сохранение формы/файлов при switcher/Back, отмена таймеров, статусы
5/5.6 секунд и duplicate POST guard. Screenshot нового banner:
`browser-final/banner-360.png`.

## Фактическая библиотека и payload

Официальный `https://mc.yandex.ru/metrika/tag.js` получен обычным GET с TLS
verification 09.10.2026. 277750 bytes; версия в browser-info — 2660; SHA-256
`0840945fe24e3329ef4cd016dbcc4fbeedf387c42bb49bfa49740a076efb032c`.
Источник — `docs/tag.js` вне repo. Документация SPA/init/hit/reachGoal/CSP
сохранена там же; ссылки в analytics.md. Разрешение mc.yandex.ru добавлено в
черновик cloud network, существующие hosts/presets сохранены; отдельная
публикация среды этим агентом не выполнялась. GET позднее подтвердил доступ.

Проверка выполняет эту библиотеку, а не mock snippet, но ответы сетевых
endpoints заменены локальным `{}`. Все запросы перехвачены до доставки. Проверены
GET watch, POST watch/1 с параметрами в query и пустым body, advert.gif и script;
URLSearchParams и site-info декодируются, параметры цели сопоставлены с allowlist.
Неизвестное непрозрачное body заставляет тест упасть, а не считается проверенным.
В этом сценарии библиотека выбрала **mc.yandex.com** для watch/advert.gif.
HTTP Referer у внешних запросов пустой благодаря отдельному document/referrer policy.

Компактные исходные значения из сохранённых network records:

```text
init: page-url=https://www.energoeffekt-rostov.ru/analytics-frame.html#g=1
      nohit=1; title=Энергоэффект — аналитика
first hit: page-url=https://www.energoeffekt-rostov.ru/?utm_source=yandex&utm_campaign=btp_rostov
           title=Энергоэффект — производство БМК, БТП, ВНС, ПНС и инженерные услуги
SPA hit: page-url=https://www.energoeffekt-rostov.ru/solutions/btp
         page-ref=https://www.energoeffekt-rostov.ru/
         title=Блочные тепловые пункты «Энерголайн» — производство и инженерное решение | Энергоэффект
lead: page-url=goal://www.energoeffekt-rostov.ru/lead_success
      page-ref=https://www.energoeffekt-rostov.ru/solutions/btp
      site-info={"product":"btp"}
```

Во всех типах payload нет private_marker/private_fragment из исходных URL и
внешнего referrer, synthetic phone, имён/содержимого документов, UUID/lead_id.
Проверены реальные network payload всех семи целей (и двух расположений CTA).
Ошибочный пустой документ не вызывает второй document_selected. После отзыва
в наблюдаемом двухсекундном окне новых запросов нет, iframe удалён и доступные
cookies _ym_* очищены. После повторного разрешения новый init/hit, без очереди
старых целей. Позднее завершение получения настоящего скрипта после отзыва не
создаёт watch. Прямое открытие analytics-frame.html не загружает библиотеку.

Это доказательство конкретной версии/сценариев с intercepted ответами. Не
подтверждает доставку в аккаунт, настройки счётчика, все возможные региональные
ответы сервера или произвольные будущие версии tag.js. Контроль после публикации
и при обновлении библиотеки остаётся отдельной приёмкой. Уже начатый до отзыва
запрос может завершиться; отмена его не обещается.

## Влияние на первоначальную загрузку

Скрипт `scripts/analytics-load.mjs`: пять холодных изолированных контекстов на
условие, один Chromium, viewport 390x844, локальные intercepted files,
no-store, без CPU/network throttling. Baseline собран из git archive исходного
HEAD с теми же установленными dependencies; отдельные outputs вне repo.
Никаких новых production LCP/Lighthouse запусков. JSON: `load-final.json`.

| Условие | Запросы всего | Запросы наружу (перехвачены) | JS bytes | gzip JS bytes | DCL, ms | LCP, ms |
|---|---:|---:|---:|---:|---:|---:|
| Исходный HEAD, без аналитики | 14 | 0 | 430944 | 113548 | 108.8 | 284 |
| Изменение, отказ | 15 | 0 | 445830 | 119216 | 114.8 | 276 |
| Разрешение, script blocked | 19 | 1 | 450737 | 121631 | 127.3 | 312 |
| Разрешение, mock script | 19 | 1 | 450737 | 121631 | 115.5 | 272 |

При отказе начальный JS вырос на 14886 bytes (14.54 КиБ), gzip на 5668 bytes
(5.54 КиБ), один дополнительный локальный shared module request. Наружу — 0.
До согласия iframe/tag не загружаются. Разброс локального LCP не доказывает
улучшения/ухудшения production; это приблизительная оценка начального overhead.
Mock/blocked условия **не являются стоимостью настоящего скрипта**. Его remote
загрузка, исполнение с реальными ответами и production LCP пока не измерены.

## Ограничения и действия владельца

- По умолчанию build flag false. Перед включением согласовать текст политики,
  сроки/основания, участников/условия передачи и удаления, территорию обработки.
  Список конкретных юридических вопросов — analytics.md, без новых гарантий.
- В кабинете вручную выключить automatic goals, Webvisor/form recording, карты,
  YTM/ecommerce/Advanced Matching; создать семь JavaScript goals. Для заявок и
  рекламы использовать lead_success, не суммировать промежуточные цели/auto goals.
- Реальная библиотека использует точный mc.yandex.com; CSP рекомендации указаны
  вместе с mc.yandex.ru. Действующий сервер не менялся, production CSP/TLS
  браузером не проверены. Не нужны wildcard или необоснованный unsafe-eval.
- Нет exactly-once аналитики: localStorage не даёт atomic cross-tab lock; блокировка,
  потеря запроса/библиотеки и отсутствие согласия объясняют разницу с backend.
  Queue команды не доказательство доставки. Никаких автоматических POST retry.
- Cookies третьих доменов/HttpOnly/недоступного storage не удаляются приложением;
  отзыв не удаляет исторические Lead или ранее переданные данные Яндекса.
- sessionStorage недоступен/вкладка закрыта/24 часа от последней ручной попытки
  истекли — восстановления retry после reload нет. ПД формы/документы не
  сохраняются в этом storage; signature не считается анонимизацией.
- Syntax allowlist не распознаёт все ПД в корректном алфавитном коде/цифрах yclid;
  подрядчик обязан использовать контролируемый словарь кампаний без персонализации.
- Backend проверен на SQLite/test settings; реальный SMTP и PostgreSQL/server
  concurrency этой новой интеграцией не проверялись. Существующая очередь не менялась.
- Реальные Windows/Chrome, кабинет, публикация и действующий сервер — отдельная
  приёмка по подготовленному checklist, автоматический браузер здесь Linux Chromium.

## HEAD, ветка, изменённые файлы и полный diff

Ветка `feature/ee-analytics`. Исходный и итоговый HEAD одинаковы: `f611bcd0b09c078e224ad9887abc7c57234a8bfb`.
Нет commit/merge/deploy/production migrate/push/опубликованного PR или PR metadata.
Изменения в working tree, staging пустой.

```text
 M README.md
 M ee_site/backend/apps/leads/admin.py
 M ee_site/backend/apps/leads/lead_creation.py
 M ee_site/backend/apps/leads/models.py
 M ee_site/backend/apps/leads/serializers.py
 M ee_site/frontend/.env.example
 M ee_site/frontend/README.md
 M ee_site/frontend/package.json
 M ee_site/frontend/scripts/browser-quality.mjs
 M ee_site/frontend/src/App.jsx
 M ee_site/frontend/src/api/leadsApi.js
 M ee_site/frontend/src/components/CaseView/CaseView.jsx
 M ee_site/frontend/src/components/CookieBanner/CookieBanner.css
 M ee_site/frontend/src/components/CookieBanner/CookieBanner.jsx
 M ee_site/frontend/src/components/Footer/Footer.css
 M ee_site/frontend/src/components/Footer/Footer.jsx
 M ee_site/frontend/src/components/Hero/Hero.jsx
 M ee_site/frontend/src/components/LeadForm/LeadForm.jsx
 M ee_site/frontend/src/main.jsx
 M ee_site/frontend/src/pages/PrivacyPage/PrivacyPage.jsx
 M ee_site/frontend/vite.config.js
?? ee_site/backend/apps/leads/attribution.py
?? ee_site/backend/apps/leads/migrations/0007_lead_campaign_attribution_lead_direction_slug_and_more.py
?? ee_site/backend/apps/leads/tests_attribution.py
?? ee_site/frontend/analytics-frame.html
?? ee_site/frontend/docs/analytics-validation.md
?? ee_site/frontend/docs/analytics.md
?? ee_site/frontend/scripts/analytics-browser.mjs
?? ee_site/frontend/scripts/analytics-load.mjs
?? ee_site/frontend/src/analytics/AnalyticsBridge.jsx
?? ee_site/frontend/src/analytics/analytics.test.js
?? ee_site/frontend/src/analytics/frame.js
?? ee_site/frontend/src/analytics/pending.js
?? ee_site/frontend/src/analytics/policy.js
?? ee_site/frontend/src/analytics/runtime.js
?? ee_site/frontend/src/analytics/store.js
```

Полный diff со всеми новыми файлами доступен в
`/workspace/ee-analytics-evidence/feature-ee-analytics.patch` и воспроизводится
из корня репозитория:

```bash
{
  git diff --binary HEAD
  while IFS= read -r -d '' file; do
    git diff --no-index --binary -- /dev/null "$file" || test "$?" -eq 1
  done < <(git ls-files --others --exclude-standard -z)
} > /tmp/feature-ee-analytics.patch
```

Проверка patch: `git apply --reverse --check /tmp/feature-ee-analytics.patch`
проверяет соответствие текущему working tree, не меняя файлов или index.


## Корректирующий этап: ожидание успеха и ошибки storage

Этот раздел обновляет поведение и результаты первоначального этапа выше.

- `lead_success`, подтверждённый при действующем разрешении, ждёт готовности
  адаптера в памяти: максимум 20 UUID и 10 секунд. Отзыв, expiry согласия,
  таймаут загрузки и смена поколения очищают очередь. Без разрешения успехи
  не накапливаются. Повторное разрешение старую очередь не восстанавливает.
- Ожидание не записывает UUID как переданный. Выбранный локальный этап —
  `postMessage` в готовый iframe завершился без исключения; только после него
  вызывается `markSuccess`. ACK приёма iframe не добавлен, доставку в Яндекс
  этот этап не подтверждает. Ошибка postMessage не создаёт отметки; повторный
  вызов success может повторить локальную попытку, но POST формы не повторяется.
- Если запись нового решения не удалась, старый consent удаляется доступным
  removeItem. При доступном удалении старое allowed не восстановится после reload;
  другие вкладки реагируют на обычный storage event. Если оба действия запрещены,
  текущий документ сохраняет отказ, включая события focus/storage, но старое
  разрешение может пережить reload или остаться в другой вкладке.
- При ошибке перезаписи очищенного retry удаляется вся сохранённая запись;
  технический UUID/направление сохраняются в памяти. Цена безопасной очистки —
  возможная потеря восстановления после reload. Если удалить тоже нельзя,
  очищается память, но физическое удаление старого storage не гарантируется.

Целевые проверки: `node --test src/analytics/analytics.test.js` — 25 passed,
0 failed, 0 skipped. Добавлено 8 тестов: success до ready и дедуп, отзыв/expiry/
таймаут и поколения, лимит/TTL, исключение postMessage, отказ записи с доступным
удалением/reload/повторным разрешением/другой вкладкой, отказ записи и удаления,
два режима очистки optional retry. Дополнительно проверено промежуточное пустое
значение storage после несохранённого отказа.

Frontend suite: 39 passed, 0 failed, 0 skipped. Lint: успешно. Обе production
сборки (flag true и default false): успешно. Существующий браузерный сценарий:
26 passed, включая сохранённый официальный tag.js; выключенная сборка: 1 passed.
Исходные результаты корректирующего этапа: correction-targeted.log,
correction-frontend-suite.log, correction-lint.log, correction-build-enabled.log,
correction-build-disabled.log, correction-browser-final/browser-results.json,
correction-browser-disabled-final/browser-results.json в /workspace/ee-analytics-evidence.
Все браузерные внешние запросы перехвачены, заявки только в isolated loopback API.
Backend и API-контракт этим этапом не изменены, backend suite повторно не запускалась.

Корректирующий diff: /workspace/ee-analytics-evidence/feature-ee-analytics-correction.patch.
Актуальный полный diff со всеми новыми файлами:
/workspace/ee-analytics-evidence/feature-ee-analytics.patch.
До исправлений сохранён snapshot изменяемых файлов в correction-before.
HEAD не менялся; commit, merge, deploy, production migrate, push и PR не выполнялись.
