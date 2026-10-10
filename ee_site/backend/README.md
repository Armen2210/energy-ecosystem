# Backend сайта «Энергоэффект»

Точка входа в серверную часть ЭЭ. Описание сверено с исходниками 10 октября
2026 года; оно не подтверждает состояние production, PostgreSQL, SMTP или nginx.
Frontend описан в [соседнем README](../frontend/README.md), история проекта —
в [корневом README](../../README.md). Готовой интеграции с 1С/CRM в коде нет.

## Назначение, стек и структура

Backend принимает публичные заявки, сохраняет их и приватные документы,
предоставляет Django Admin и управляет уведомлениями менеджерам.
`requirements/base.txt` фиксирует Django 5.2.13, DRF 3.17.1, psycopg/psycopg-binary
3.3.3, python-dotenv и django-cors-headers. Версия Python в репозитории отдельно
не закреплена; выбирайте совместимую с зафиксированными зависимостями.
Обычные local/prod settings используют PostgreSQL; изолированные тесты — SQLite.
Gunicorn упоминается в серверной истории, но в этом requirements его нет:
серверный runtime и способ установки проверяются владельцем отдельно.

```text
ee_site/backend/
  manage.py
  requirements/base.txt
  config/
    settings/base.py       # общие настройки, .env и переменные процесса
    settings/local.py      # DEBUG=True, local PostgreSQL
    settings/test.py       # отдельные SQLite/locmem настройки тестов
    settings/prod.py       # DEBUG=False, secure cookies, trusted origins
    urls.py                # admin и api/leads; DEBUG-раздача media
    wsgi.py, asgi.py
  apps/
    users/                 # пользовательская модель AUTH_USER_MODEL
    companies/             # модели компаний
    projects/              # модели проектов
    activity_logs/         # модели журнала активности
    leads/                 # публичная заявка, storage, защита, уведомления
      migrations/
      management/commands/
  docs/                    # эксплуатационные инструкции ниже
```

Остальные приложения зарегистрированы, но публичный URLconf подключает только
admin и API заявок. Каталоги `media`, `private_uploads`, `staticfiles` и отдельный
SQLite rate store являются runtime-данными, не исходниками.

## Установка и выбор окружения

Из корня репозитория, Linux:

```bash
cd ee_site/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements/base.txt
```

Windows/PowerShell:

```powershell
cd ee_site/backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements/base.txt
```

Если выполнение Activate.ps1 запрещено политикой компьютера, используйте
`.\.venv\Scripts\python.exe` вместо `python`; менять общую execution policy
для запуска проекта не требуется. Requirements сохранён с UTF-16 BOM;
не переписывайте зависимости при локальном решении проблемы установки.

`manage.py`, WSGI и ASGI по умолчанию выбирают `config.settings.local`, если
`DJANGO_SETTINGS_MODULE` уже не задан. В командах ниже settings указаны явно;
для сервиса production задайте `DJANGO_SETTINGS_MODULE=config.settings.prod`.

| Settings | Фактическое поведение |
| --- | --- |
| `config.settings.local` | Импортирует base, принудительно DEBUG=True; PostgreSQL из DB_*; почта из base. Не для публичного сервера. |
| `config.settings.test` | Не читает backend/.env; SQLite `:memory:`, отдельный test-only ключ, locmem email, быстрый password hasher, limiter по умолчанию off. Только тесты, не обычный сайт. |
| `config.settings.prod` | Импортирует base, принудительно DEBUG=False, secure session/CSRF cookies, SECURE_PROXY_SSL_HEADER для доверенного HTTPS proxy; PostgreSQL из DB_*. Сам по себе не настраивает nginx/worker. |

Base загружает `backend/.env` через python-dotenv без переопределения уже заданных
переменных процесса. Файлы `.env.local`/`.env.production` автоматически не читаются
(это не приоритет Vite). Не коммитьте `.env`, дампы или секреты. Test settings
не очищают всё окружение процесса: наследуемые необязательные настройки могут
влиять на тесты, несмотря на явную замену DATABASES/EMAIL_BACKEND/SECRET_KEY.

### Переменные окружения

| Переменные | Назначение |
| --- | --- |
| `DJANGO_SETTINGS_MODULE` | Явный выбор local/test/prod для процесса. |
| `DJANGO_SECRET_KEY` | Собственный ключ local/prod; обязателен, не публикуется. Не `SECRET_KEY` в .env. |
| `DJANGO_ALLOWED_HOSTS` | Hostname через запятую; local — localhost/127.0.0.1, production — согласованные домены. |
| `DJANGO_DEBUG` | Base сравнивает с точным `True`; local/prod всё равно переопределяют DEBUG. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL конкретной среды; для local — отдельная локальная БД и пользователь. |
| `CSRF_TRUSTED_ORIGINS` | HTTPS origins через запятую в prod, в частности для admin; не отключает CSRF повсюду. |
| `EMAIL_BACKEND` | По умолчанию SMTP. Для локальных синтетических данных — console/locmem; не использовать console с реальными клиентскими данными. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP этой среды; port по умолчанию 587, секреты снаружи Git. |
| `EMAIL_USE_TLS`, `EMAIL_USE_SSL` | Точное значение `True` включает соответствующий режим; defaults True/False. Согласовать с почтовым сервером. |
| `EMAIL_TIMEOUT` | Положительное конечное число секунд, default 10; timeout операций, не SLA общего запроса. |
| `DEFAULT_FROM_EMAIL`, `SERVER_EMAIL`, `LEAD_NOTIFICATION_EMAIL` | Отправители и согласованные получатели; отсутствие получателя даёт failed, не гарантированную доставку. |
| `LEAD_NOTIFICATION_MODE` | `sync` по умолчанию либо `background` с подготовленным worker. |
| `LEAD_PRIVATE_ATTACHMENT_ROOT` | Закрытый каталог вне MEDIA_ROOT, default `<backend>/private_uploads`. |
| `LEAD_MAX_FILES`, `LEAD_MAX_FILE_SIZE`, `LEAD_MAX_TOTAL_FILE_SIZE` | Defaults 10 файлов, 10485760 и 26214400 байт. Согласовать с frontend. |
| `LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE` | Default 10485760 байт: весь набор прикладывается только если суммарно помещается. |
| `LEAD_MAX_REQUEST_SIZE`, `LEAD_MAX_FORM_FIELDS` | Default 28311552 байта (27 МиБ всего тела), 64 обычных значения. |
| `LEAD_RATE_LIMIT_ENABLED`, `LEAD_RATE_STORE` | Default true и `<backend>/lead_rate_limits.sqlite3`; один закрытый локальный файл всем web workers одного хоста. |
| `LEAD_RATE_BURST_LIMIT`, `LEAD_RATE_BURST_SECONDS` | Defaults 20 попыток / 60 секунд. |
| `LEAD_RATE_SUSTAINED_LIMIT`, `LEAD_RATE_SUSTAINED_SECONDS` | Defaults 100 попыток / 3600 секунд. |
| `LEAD_TRUSTED_PROXY_NETWORKS`, `LEAD_TRUST_UNIX_SOCKET_PROXY` | Defaults пустой CIDR-список / false; доверие только подтверждённому proxy. |

`CORS_ALLOWED_ORIGINS` в base сейчас задан кодом для localhost/127.0.0.1:5173,
а не одноимённой env-переменной. Иная dev-origin требует отдельной конфигурации.
Не включайте произвольный CORS как замену проверке topology и защиты endpoint.

## Безопасный локальный запуск

Сначала подготовьте **отдельную local PostgreSQL БД**, DB_* и собственный
DJANGO_SECRET_KEY в локальном окружении; не используйте production-реквизиты.
Не выбирайте test settings как способ обычного запуска сайта. Для синтетической
проверки без настоящего SMTP установите console backend, например:

Linux (из backend, после активации venv):

```bash
export DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
export EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
export LEAD_NOTIFICATION_MODE=sync
python manage.py check --settings=config.settings.local
python manage.py migrate --plan --settings=config.settings.local
# Только после проверки, что DB_* относятся к отдельной local БД:
python manage.py migrate --settings=config.settings.local
python manage.py runserver 127.0.0.1:8000 --settings=config.settings.local
```

PowerShell отличается установкой переменных; Django-команды те же:

```powershell
$env:DJANGO_ALLOWED_HOSTS = 'localhost,127.0.0.1'
$env:EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
$env:LEAD_NOTIFICATION_MODE = 'sync'
python manage.py check --settings=config.settings.local
python manage.py migrate --plan --settings=config.settings.local
# Только для проверенной отдельной local БД:
python manage.py migrate --settings=config.settings.local
python manage.py runserver 127.0.0.1:8000 --settings=config.settings.local
```

Прямой loopback-запуск использует REMOTE_ADDR; trusted proxy список оставьте
пустым и Unix opt-in выключенным. Private storage и каталог rate store должны
быть доступны процессу и не раздаваться HTTP. При отсутствии PostgreSQL требуется
отдельный локальный settings override, согласованный с base; готового штатного
local SQLite модуля в коде нет. Не подменяйте его test settings.

### Системные проверки, тесты и миграции

Переносимые команды из backend, без настоящего SMTP и обычной БД:

```text
python manage.py check --settings=config.settings.test
python manage.py test --settings=config.settings.test --noinput
python manage.py makemigrations --check --dry-run --settings=config.settings.test
```

Они не подтверждают PostgreSQL concurrency, nginx/Gunicorn или доставку почты.
Для настроенной отдельной local БД просмотр состояния:

```text
python manage.py showmigrations --settings=config.settings.local
python manage.py migrate --plan --settings=config.settings.local
```

Схемные миграции `leads` идут от `0001_initial` до
`0007_lead_campaign_attribution_lead_direction_slug_and_more`: поля уведомлений,
submission_id/fingerprint, private attachments, legacy mapping и attribution.
Миграции других приложений также нужны; не применяйте только последний файл вручную.
`makemigrations --check --dry-run` проверяет отсутствие новых схемных изменений,
но не факт применения существующих миграций на сервере.

Будущее production-применение выполняет владелец после согласованных backup БД
и файлов, проверки восстановления и плана отката, с явным `--settings=config.settings.prod`.
Сначала `check --deploy` и `migrate --plan`, затем отдельно согласованный `migrate`
и `collectstatic` с теми же settings. Эти команды здесь **не выполнялись**.

## Публичный API заявок

`POST /api/leads/` без authentication/permission; endpoint специально CSRF-exempt.
Это не разрешение отключать CSRF у admin. Принимаются multipart/form-data и
application/x-www-form-urlencoded для формы без файлов; JSON parser не подключён.
В браузере при FormData не задавайте Content-Type вручную: boundary нужен parser.
GET для списка/чтения заявок публично не реализован.

| Поле | Контракт |
| --- | --- |
| `name`, `phone` | Обязательные; max_length 255 и 50. |
| `company_name`, `email`, `description` | Необязательные; company max 255, email проходит EmailField. |
| `source_page`, `source_system` | Строки max 255/100; default source_system — ee_site. |
| repeated `attachments` | До 10 непустых документов, каждый ≤10 МиБ, сумма ≤25 МиБ. |
| legacy `attachment` | Один документ по тем же лимитам. Нельзя смешивать с attachments, повторять legacy или использовать неизвестное файловое поле. |
| `submission_id` | Необязательный UUID; без него повтор не защищён от дублей. |
| `direction_type`, `direction_slug` | Необязательная согласованная пара из фиксированного каталога product/service. |
| `campaign_attribution` | Необязательный JSON в multipart-строке: version=1, first/last с tags и at; {} допустимо. |

`status`, `id`, `created_at`, `updated_at` read-only. Согласие обработки данных формы
проверяется frontend и удаляется из FormData; отдельного обязательного consent
поля/аудита согласия этот serializer не реализует. Backend не может самостоятельно
доказать аналитическое разрешение посетителя по optional campaign payload.

Первый валидный запрос создаёт Lead, private LeadAttachment и pending-уведомление
в одной DB-транзакции. Файловое storage не образует общей транзакции с DB:
обычные ошибки используют cleanup, аварийное завершение может оставить orphan.

| Ответ | Значение |
| --- | --- |
| `201 {"id": ...}` | Новая заявка сохранена; не доказательство доставки email/цели. |
| `200 {"id": ..., "duplicate": true}` | Тот же UUID и fingerprint: без новых документов и уведомления. |
| `400` | Field errors либо нарушения файлового контракта/лимитов. |
| `409`, code `submission_conflict` | UUID уже использован для другого содержимого. |
| `413` | Превышено тело/штатные parser ceilings; proxy может вернуть HTML. |
| `429` | IP-лимит, Retry-After и retry_after; proxy также может вернуть HTML. |
| `503`, code `lead_protection_unavailable` | Защита не может безопасно определить IP или обратиться к rate store. |

Fingerprint содержит нормализованные name/company/phone/email/description/source,
имя, размер и SHA-256 байтов файлов; repeated attachments учитывают порядок.
Переход между legacy и новым файловым контрактом может изменить fingerprint.
Направление и campaign не входят в него: сохраняется первое принятое значение,
повтор не переписывает источник. Admission/rate limit проверяются и для повторов.
Нельзя автоматически повторять POST ради аналитики; неопределённый ответ разрешает
ручной повтор с тем же ключом и тем же содержимым. Это идемпотентность сохранения
заявки, не exactly-once доставки уведомлений или аналитики.

## Документы, защищённое скачивание и исторические файлы

Все новые документы обоих контрактов идут в `LeadAttachment` с private storage
вне MEDIA_ROOT. Storage не выдаёт публичный URL. Скачивание через Django Admin
`/admin/leads/lead/attachments/<attachment_id>/download/` требует staff,
`leads.view_lead` и разрешения просмотра соответствующей заявки; ответ — FileResponse
as_attachment. Нет inline-preview или публичного API скачивания.

Набор документов к email прикладывается целиком только при сумме ≤
LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE (default 10 МиБ); иначе ни одного файла,
сотруднику предлагается admin по ID. Типы не ограничены, архивы не распаковываются,
файлы не исполняются. Антивирус и политика удаления/retention не реализованы.

Старое `Lead.attachment` и исторические публичные файлы сохранены. Подробная
[инструкция переноса](docs/legacy-lead-attachment-migration.md) описывает
`migrate_legacy_lead_attachments`, dry-run по умолчанию, `--apply`, `--verify`,
проверку хешей, платформенные ограничения и откат.
**Копирование само по себе не закрывает публичные исходники.** Закрытие nginx/media
и удаление источников — отдельный этап после проверки полноты и восстановления.
Команда переноса не заменяет схемный `migrate` и не отправляет уведомлений.

## Уведомления, worker и ручной retry

- `sync` (default): `transaction.on_commit` выполняет отправку в web-процессе
  после сохранения, без открытой транзакции на время SMTP. Ошибка уведомления
  не отменяет уже созданную заявку.
- `background`: устойчивым заданием служит строка Lead, worker забирает pending;
  повтор заявки не создаёт отдельный job. Worker в sync запускаться не должен.

Для **изолированной настроенной local среды** в background (Linux/PowerShell
имеют те же команды; установите LEAD_NOTIFICATION_MODE и console email способом
из раздела выше):

```text
python manage.py process_lead_notifications --settings=config.settings.local --limit 20
python manage.py process_lead_notifications --settings=config.settings.local --continuous --limit 20 --interval 5
python manage.py lead_notification_status --settings=config.settings.local --sending-older-than 30
```

Перед запуском sending-команд проверьте DB/почту; они не являются read-only.
Диагностика lead_notification_status ничего не отправляет/не меняет.
Состояния: pending → sending (атомарный claim и attempts) → sent либо failed.
`sent` означает принятие email backend, а не доставку/прочтение получателем.
Исторический `unknown` не отправляется автоматически. Worker не повторяет failed,
sending, unknown или sent автоматически. Admin action с change permission
обрабатывает до пяти failed: в sync отправляет, в background возвращает в pending.
Старый sending требует ручного разбора журналов и SMTP — возможно, письмо принято
до сбоя сохранения результата. Exactly-once и фиксированная длительность не гарантируются.

[Полная инструкция worker](docs/lead-notification-worker.md) содержит порядок
согласованного переключения/отката и пример supervisor/systemd. И web, и worker
должны использовать одну БД, одинаковый mode и доступ к private storage.
Логи приложения идут в stdout/stderr; server journal требует отдельной настройки.
Не журналируйте контакты, тела заявок, файлы или секреты.

## Защита запросов и ограничения инфраструктуры

[Инструкция request protection](docs/lead-request-protection.md) и
[nginx-шаблон](../deploy/nginx_lead_request_protection.conf.example) — основной
операционный источник. Только POST публичной формы защищён этим limiter.
Проверка выполняется до parser/fingerprint/create; учитываются и невалидные
попытки и идемпотентные повторы. По умолчанию 20/60 секунд и 100/3600 секунд.
SQLite rate store атомарен между workers **одного хоста с одним локальным файлом**,
не NFS и не distributed limiter. Ошибка хранилища/таймаут закрывает приём с 503.
IP-limit не останавливает распределённых ботов и не задаёт общую квоту диска/очереди.

Прямой TCP: используется REMOTE_ADDR. За доверенным TCP nginx — только корректный
перезаписанный X-Real-IP от проверенного peer CIDR; X-Forwarded-For не используется.
Unix opt-in допустим только для закрытого socket с контролем прав и отсутствующим
peer IP. Не доверяйте всем сетям. При CDN/LB сначала согласуйте nginx real_ip.
Gunicorn не должен быть доступен напрямую в обход nginx. HTTPS proxy header в prod
также предполагает эту закрытую topology и перезапись X-Forwarded-Proto.

Upload guards ограничивают всё тело 27 МиБ и обычные значения 64; штатные Django
ceilings тоже действуют. Файловые ограничения строже общих parser defaults.
Порог FILE_UPLOAD_MAX_MEMORY_SIZE — выбор памяти/temp, не максимальный размер файла.
Следует контролировать nginx/Django temp, свободное место, 429/503 и рост очереди.

## Атрибуция и направление

Product slug: bmk, btp, vns, pns, automation-cabinets. Service slug: design,
construction-installation, commissioning. Serializer отклоняет несогласованную пару.
Direction — операционное поле, не зависит от аналитического согласия в frontend.

Campaign version 1: first/last с tags/at; разрешены только utm_source, utm_medium,
utm_campaign, utm_content, utm_term и yclid. Backend проверяет структуру, размер
до 2048 символов, коды/порядок/время (2000 год — now + 5 минут). Frontend применяет
30-дневный срок и consent; backend сам не удаляет старые сохранённые Lead/источники
по этому TTL. Отзыв аналитики не удаляет историческую заявку.
Синтаксический allowlist не гарантирует отсутствие ПД по смыслу.
Подробности — [спецификация аналитики](../frontend/docs/analytics.md).

## Что проверено и что требуется перед серверным внедрением

Предыдущая локальная suite — 106 backend-тестов; владелец также сообщил 106 passed
на Windows, frontend 39 и успешные lint/build. SQLite/mocks не подтверждают
PostgreSQL concurrency, реальный SMTP, topology nginx/Gunicorn или поступление
событий Метрики. При текущей правке документации suites/БД/SMTP не запускались.

Перед следующим этапом владелец должен отдельно:

1. Проверить runtime/dependencies и effective prod settings без вывода секретов;
   подготовить backup БД, media/private storage и проверенный откат/восстановление.
2. Проверить миграционный план и применение схемы (включая leads 0007), static,
   права private/rate/temp каталогов и отсутствие их публичной раздачи.
3. Проверить trusted proxy/HTTPS headers, nginx body/rate limits, общий локальный
   rate store всех workers; при нескольких хостах нужен другой согласованный limiter.
4. Сохранить согласованный notification mode либо безопасно подготовить worker,
   проверить реальную отправку/диагностику и конкурентность на отдельной PostgreSQL БД.
5. Инвентаризовать исторические вложения и выполнить перенос/verify отдельным
   этапом; затем отдельно закрыть публичные исходники по плану отката.
6. Проверить API, direct SPA URL, файлы/ошибки/retry браузером на целевой среде;
   согласовать юридические сроки/основания и настройки кабинета Метрики перед
   отдельным включением build-флага и проверкой реального приёма событий.

Ни PR, ни merge/deploy, production migrate или настройка кабинета этой
документацией не объявляются выполненными.
