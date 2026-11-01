# Электронные ОЛ: внедрение и восстановление

Ветка `feature/ee-electronic-questionnaires` основана на принятом этапе документов
`d3dafac9b703dd26bab0b97cd0b3bb0dd393e7ef`. Публичные 14 документов не меняются.
Релиз включает ВНС, ПНС, БМК, БТП; обычные заявки используют прежний путь.
Backend/worker рассчитаны на Linux, Python 3.12, PostgreSQL. Фактические имена
служб и каталоги на сервере нужно сверить: ниже проектный путь из существующего
README, а не утверждение об обследовании production.

## До внедрения

Сохранить предыдущий backend/frontend release, vhost nginx, резервную копию БД
и private storage. Проверить восстановление и свободное место. Не выполнять
reverse migrations 0008–0010 при откате: они содержат принятые ответы/job.
Управление live-хостингом из текущей облачной среды не настроено; внедрение
не выполнялось. Настройки БД/SMTP использовать из действующего EnvironmentFile,
не копировать значения в команды, Git или отчёт.

Новая зависимость: `pip install -r requirements/base.txt` (файл UTF-16).
ReportLab 4.4.10 BSD, DejaVu Sans TTF системно (`fonts-dejavu-core` на Debian).
Нужны subprocess/resource и права записи в закрытый `LEAD_PRIVATE_ATTACHMENT_ROOT`.
Корневой каталог `contracts/questionnaires/v1` также входит в backend release:
не копировать только `ee_site/backend` без него. Для воспроизведения старых
заявок worker использует сохранённый снимок схемы и контактов.

## Совместимый порядок

1. Сначала backend с `QUESTIONNAIRES_ENABLED=False`. Развернуть код и зависимости,
   сохранив действующие DB/SMTP/private/rate настройки. Из `ee_site/backend`:
   ```sh
   .venv/bin/python manage.py check --settings=config.settings.prod
   .venv/bin/python manage.py migrate --plan --settings=config.settings.prod
   .venv/bin/python manage.py migrate --noinput --settings=config.settings.prod
   .venv/bin/python manage.py check_questionnaire_readiness --settings=config.settings.prod
   ```
   Preflight проверяет схему, TTF и пробную запись в private storage; не отправляет
   почту и не подтверждает работающий supervisor/SMTP. Применить штатный restart
   Gunicorn (`ee_site_gunicorn.service` — историческое имя, проверить на хосте).
2. Зарегистрировать **один** постоянно работающий отдельный worker под тем же
   service user/EnvironmentFile/venv/DB/private root, что backend:
   ```sh
   .venv/bin/python manage.py process_questionnaires --settings=config.settings.prod --continuous --limit 10 --interval 5
   ```
   Использовать systemd/supervisor, не `nohup` в web worker. См. example unit
   `ee_site/deploy/ee-questionnaires.service.example`. Установить restart on-failure,
   лимит памяти/CPU, остановку с grace >= 60 секунд. Один job за раз; batch 10
   не означает 10 параллельных рендереров. Не запускать worker от root.
   Существующий `process_lead_notifications` при background оставляется для
   **обычных** заявок: он исключает questionnaire_job. Второго отправителя ОЛ нет.
3. Проверить worker, команды/зависимости, права и отсутствие pending migrations.
   Затем включить `QUESTIONNAIRES_ENABLED=True` для backend, перезапустить его.
   GET `/api/leads/questionnaire-capabilities/` должен вернуть enabled=true,
   version=1 и четыре изделия. Ответ no-store. Флаг отключает только приём новых
   ОЛ и UI; уже принятые работы продолжают обрабатываться.
4. Собрать frontend из `ee_site/frontend` на Node 24:
   ```sh
   npm ci --include=dev
   npm test
   npm run lint
   export VITE_API_BASE_URL='' # same-origin действующего API; сверить topology
   export VITE_EE_ANALYTICS_ENABLED=false
   npm run build
   npm run test:prerender
   ```
   Build и prerender tests используют одни VITE-переменные. Опубликовать **полный**
   versioned dist (20 страниц + 404) по существующему deploy/README.md: root и
   generated nginx include одной версии, `nginx -t` до reload, предыдущие assets
   сохранить на время перехода. Общие API/admin/private/rate правила не менять.
   UI проверяет capability до открытия и ещё раз перед POST с ОЛ; при старом
   backend/выключенном флаге новый payload не отправляется.
5. С согласованными синтетическими данными проверить обычную заявку без ОЛ,
   две ОЛ в одной заявке, повтор submission_id, отображение четырёх ответов в
   Admin, worker и приватные PDF. Контролировать pending/retry/intervention/uncertain,
   notification status и получение штатным адресатом. Реальные SMTP и production
   отправки в облачных проверках не выполнялись. Удалять тестовые записи только
   по принятой политике владельца.

## Состояния и повтор

Заявка, снимки ОЛ/контактов/версий и job атомарны в PostgreSQL. После commit
клиент получает «принято», это не подтверждение почтовой доставки. Job:
`pending → generating → sending → done`. Генерация запускается только worker.

`generating` получает уникальный UUID token и lease 5 минут. Рендер каждого PDF
ограничен 45 с wall / 30 с CPU / 512 МиБ, до четырёх PDF. Имя storage включает
lease token; перед публикацией файла проверяется актуальный token под DB-lock.
Старый исполнитель не может опубликовать файл или перезаписать результат нового.
Готовый PDF проверяется по размеру/SHA-256 и переиспользуется. Отсутствующий либо
повреждённый PDF восстанавливается при повторной безопасной обработке.

Ошибка генерации/подготовки письма: `retry`, задержка 2 минуты, максимум 3 захвата,
затем `intervention`. Снимки не удаляются. После устранения причины сотрудник с
правом change может поставить безопасный retry через Admin Questionnaire jobs.
Падение после commit до первого worker не теряет pending. Истёкший generating
может быть захвачен снова; первые очереди с будущим next_run не блокируют новые.

После перехода в `sending` автоматический resend запрещён при истечении lease
или ошибке SMTP: `uncertain`, уведомление `unknown`. Стабильный Message-ID
`<ee-lead-ID@energoeffekt-rostov.ru>` помогает расследовать, но не гарантирует
дедупликацию SMTP. Особенно важно окно после принятия письма SMTP до DB-result.
**Не ставить uncertain обратно в pending без расследования.** Оператор сверяет
логи почты и прекращение старого worker, затем выполняет осознанное решение:
```sh
python manage.py resolve_questionnaire_job --settings=config.settings.prod --lead ID
# После проверки SMTP, при принятом письме:
python manage.py resolve_questionnaire_job --settings=config.settings.prod --lead ID --decision sent --acknowledge-smtp-duplicate-risk
# Если требуется новая отправка, с пониманием возможного дубля:
python manage.py resolve_questionnaire_job --settings=config.settings.prod --lead ID --decision retry --acknowledge-smtp-duplicate-risk
```
Без decision команда read-only. Не менять answers/contact_snapshot/definition
для исправления инфраструктурных ошибок. Для ответственного сотрудника назначить права view/change Questionnaire job;
обычный просмотр PDF/readonly снимков остаётся за leads.view_lead.
Состояния видны в отдельном Admin jobs,
PDF — readonly inline заявки с проверкой staff + leads.view_lead и object permission.
Публичных URL нет; скачивание attachment, private/no-store. Private root не должен
находиться в MEDIA_ROOT или под раздаваемым nginx root.

## Файлы и письмо

При приёме пользовательские вложения используют существующую транзакционную
очистку. PDF сохраняется под новым token-именем, ссылка в БД публикуется под lock;
при crash между записью файла и DB возможен orphan. Команда:
```sh
python manage.py audit_questionnaire_files --settings=config.settings.prod
# Только после просмотра dry-run; удаляются лишь НЕ referenced PDF старше 24 ч:
python manage.py audit_questionnaire_files --settings=config.settings.prod --apply
```
Integrity failures выводятся по ID, содержимое ответов не журналируется. Утрату
готовых PDF после sent/done расследовать как нарушение storage/backup, не
возвращать job в pending без решения о риске повторного письма. Приватное
восстановление файла возможно из сохранённого snapshot отдельной процедурой;
первая версия штатно восстанавливает недостающие PDF при safe retry до отправки.

PDF ОЛ имеют приоритет. Для заявок с ОЛ общий бюджет существующего
`LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE` проверяется по итоговому MIME письму.
Если полный комплект с пользовательскими файлами не помещается, прикладываются
все PDF, пользовательские файлы остаются в защищённом Admin, письмо это явно
сообщает. Если даже PDF не помещаются, отправки без них нет: retry/intervention.
Обычные заявки сохраняют прежнюю политику. Лимиты uploads/SMTP не увеличены.

Пределы (переменные backend): QUESTIONNAIRE_MAX_ITEMS=4, MAX_OUTLETS=100,
MAX_BYTES=262144, MAX_TEXT=2000, MAX_PDF_BYTES=5242880, MAX_ATTEMPTS=3,
PDF_TIMEOUT=45 (у всех префикс QUESTIONNAIRE_). Начальные frontend пределы
заданы versioned contract; изменение пределов согласовывать с UI и максимальными
тестами, не обрезать данные. Пустые/отрицательные значения конфигурации запрещены
system check. Путь TTF — QUESTIONNAIRE_FONT_PATH.

## Откат

При проблеме выключить `QUESTIONNAIRES_ENABLED`, вернуть предыдущий полный
frontend dist/root/include по существующей инструкции. Backend с миграциями и
worker **оставить**, чтобы уже принятые ОЛ были доступны и обрабатывались.
Не откатывать backend к коду без таблиц/worker после приёма первой ОЛ, не удалять
таблицы и private файлы. При проблеме генератора остановить только новый worker,
сохранить очередь и snapshots, исправить зависимость/диск/код, продолжить его;
обычные заявки работают отдельно. После исправления — preflight, synthetic smoke,
worker status и только затем повторное включение UI. Merge/deploy требуют
предварительного отчёта владельцу; текущие локальные проверки не являются deploy.
