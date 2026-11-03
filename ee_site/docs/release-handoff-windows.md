# Локальная приёмка на Windows (PowerShell)

Нужны Git, Node **24**, Python **3.12**. Начинайте из чистого локального checkout `feature/ee-documents` после обычного pull; не затирайте свои изменения. Не копируйте production `.env`. Ниже создаются только временные локальные настройки/данные; реальный SMTP и Метрика выключены. Эти команды подготовлены по настройкам проекта, но native Windows в облаке не запускался.

## Backend

Из корня репозитория:

```powershell
cd ee_site/backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements/base.txt
.\.venv\Scripts\python.exe -m pip check
$eeLocal = Join-Path $env:TEMP ("ee-local-accept-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $eeLocal | Out-Null
@'
from pathlib import Path
from config.settings.test import *
LOCAL_ROOT = Path(__file__).resolve().parent
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'testserver']
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': LOCAL_ROOT / 'local.sqlite3'}}
MEDIA_ROOT = LOCAL_ROOT / 'media'
LEAD_PRIVATE_ATTACHMENT_ROOT = LOCAL_ROOT / 'private'
LEAD_RATE_STORE = str(LOCAL_ROOT / 'rate.sqlite3')
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
LEAD_NOTIFICATION_EMAIL = 'local-test@example.invalid'
QUESTIONNAIRES_ENABLED = True
CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173']
'@ | Set-Content -Encoding utf8 (Join-Path $eeLocal 'ee_accept.py')
$env:PYTHONPATH = $eeLocal
.\.venv\Scripts\python.exe manage.py check --settings=ee_accept
.\.venv\Scripts\python.exe manage.py migrate --settings=ee_accept --noinput
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --noreload --settings=ee_accept
```

`migrate` здесь относится **только к новой SQLite во временном каталоге**, не к серверу. Console email печатает тестовые письма в терминал и ничего не доставляет; используйте только вымышленные сведения. Test settings не читают `.env`. Остановить Ctrl+C. Не запускать production worker/команды повторной отправки.

Для изолированных автоматических проверок доступны `manage.py check --settings=config.settings.test` и `manage.py test --settings=config.settings.test --noinput`. Полный worker/PDF suite требует Linux/WSL2: Unix `resource` и файловые блокировки отсутствуют на native Windows; не отключать лимиты ради зелёного результата. Проверку успешного ОЛ/PDF выполнять на локальном API в WSL2/Linux с теми же изолированными настройками и шрифтами из runbook. Локальный native Windows не является подтверждением готовности Linux production.

## Frontend

Во втором PowerShell из корня checkout:

```powershell
cd ee_site/frontend
npm ci --include=dev
npm test
npm run lint
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8000'
$env:VITE_EE_ANALYTICS_ENABLED = 'false'
npm run build
npm run test:prerender
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Открыть локальное приложение на порту 5173. Данные ОЛ зависят от capabilities локального backend; если он недоступен, сначала проверить его терминал. Не отправлять формы на публичный домен. Для просмотра production-сборки остановить dev и выполнить `npm run preview -- --host 127.0.0.1 --port 5173 --strictPort`.

## Ручная проверка

1. На ширинах 360/390 и 1440 px проверить кнопки: текст/фон читаемы в обычном, hover, Tab-focus и disabled/submitting состояниях; file input имеет имя «Документы к заявке»; нет горизонтального переполнения. Проверить также 640/768/960 px.
2. Только ОЛ: включить лист, ввести данные, свернуть/выключить его и нажать очистку. Должно быть подтверждение; отмена сохраняет ответы. Повторить со смешанным черновиком, обычными полями и синтетическим файлом. Подтверждение очищает всё; действительно пустая форма очищается без лишнего диалога. Во время отправки очистка заблокирована. Проверка успешного ОЛ — на Linux/WSL2, как указано выше.
3. На `/services/design` проверить качество/пропорции hero, Network → WebP вместо исходного JPEG 1,54 МБ; разные viewport/DPR выбирают подходящий вариант. Проверить reload и Back/Forward, отсутствие console errors.
4. Включить в Windows уменьшение анимации: переходы к разделам/якорям без длительного плавного скролла. Проверить оба режима, клавиатуру и возврат из модальных окон.
5. Фиксировать результат/exit code без `.env`, credentials и клиентских файлов. Письмо в console — доказательство формирования, не доставки. Настоящие цели Метрики не отправлять.
