# Проверка frontend ЭЭ на Windows

Команды выполняются в `ee_site/frontend` из текущей feature-ветки. Требуются Node.js 24, Python 3 и Chrome. Backend/SMTP/production БД для этих проверок не нужны. Браузерные сценарии перехватывают API mock-ответами; Lighthouse формы не отправляет.

## Инструменты и production build (PowerShell)

```powershell
npm ci
npm test
npm run lint
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8000'
npm run build
$tools = Join-Path $env:TEMP 'ee-quality-tools'
npm install --prefix $tools --no-audit --no-fund lighthouse@13.0.1 playwright@1.57.0
$env:QUALITY_TOOLS_DIR = Join-Path $tools 'node_modules'
$env:PLAYWRIGHT_MODULE = Join-Path $tools 'node_modules/playwright/index.mjs'
$env:CHROME_PATH = Join-Path $env:ProgramFiles 'Google/Chrome/Application/chrome.exe'
$env:QUALITY_OUTPUT = Join-Path $env:TEMP 'ee-quality-after'
python scripts/serve-quality.py dist --port 4175
```

Последняя команда занимает терминал. Во втором терминале снова задайте переменные инструментов и `QUALITY_OUTPUT` и выполните:

```powershell
node scripts/browser-quality.mjs
node scripts/interaction-quality.mjs
node scripts/measure-quality.mjs
```

Если Chrome установлен в другом месте, исправьте только `CHROME_PATH`. Используйте одну и ту же версию браузера до/после. Инструменты устанавливаются вне репозитория; package.json и lock-файл приложения не изменяются.

`browser-quality.mjs` проверяет реальное приложение в браузере и сохраняет full-page PNG для 360, 390, 640, 768, 960 и 1440 px и изображения формы с длинным именем документа. Это браузерные регрессионные проверки; `npm test` отдельно запускает Node-тесты API/helper-функций.

`measure-quality.mjs` сохраняет 24 Lighthouse JSON: три холодных прогона каждой страницы `/`, `/solutions/btp`, `/cases`, `/contacts` для mobile/desktop. Настройки mobile — Lighthouse 13 defaults; desktop — 1440×900, DPR 1, simulated RTT 40 ms, 10240 Kbit/s, CPU×1. Настройки и версия записаны в каждом JSON; mobile — 412×823, DPR 1.75, simulated RTT 150 ms, 1638.4 Kbit/s, CPU×4. Локальный сервер передаёт файлы без gzip/Brotli, поэтому абсолютные значения не равны production.

`interaction-quality.mjs` запускает по три независимых прогона для 390×900 и 1440×900, без сетевого/CPU throttling. `domStateConfirmationMs` — click capture → первый rAF, обнаруживший ожидаемое DOM-состояние перед paint. `domMutationConfirmationMs` отдельно отмечает обнаружение ожидаемого состояния через MutationObserver; `rafSamplingDelayMs` — ожидание rAF после этой отметки. При отсутствии подходящей DOM-мутации два последних значения равны null. Ни один показатель не доказывает завершённую отрисовку. Event Timing с ненулевым interactionId отбирается по startTime внутри pointerdown → rAF confirmation; long tasks — по пересечению этого окна. Время доставки observer (350 ms) в метрику не входит. События короче 16 ms могут отсутствовать; пустой массив не означает нулевую задержку. Ожидание окончания намеренной плавной прокрутки не включено. Это лабораторные данные, не полевой INP.

## Целевое сравнение модального окна на сохранённых сборках

```powershell
node scripts/test-interaction-timing.mjs
node scripts/compare-case-interactions.mjs C:/path/to/before/dist C:/path/to/after/dist C:/path/to/case-review
```

Runner сам запускает только локальные статические Python-серверы на 4186/4187 и закрывает их. Выполняет семь прогонов каждой пары before/after на двух ширинах, чередуя порядок. Сценарии: первая загрузка фотографий, предварительное decode всех фотографий, диагностическая замена только галереи на 1×1 PNG. Новый context на вариант; фоновые изображения/шрифты/scroll стабилизированы. Routing одинаково отключает HTTP cache; preload может сохранять decoded image в памяти. Backend и внешние запросы блокируются. `QUALITY_RUNS` допускает не менее пяти прогонов; при другом имени Python задайте `$env:PYTHON = 'py'`. Фотографии проверяются через отдельное время разрешения `decode()` после DOM-confirmation: оно не доказывает завершения paint/анимации. Результаты и ограничения — frontend-interaction-review.md.

Быстрый переход сразу после загрузки, без стабилизации фоновых картинок:

```powershell
$env:QUALITY_SCENARIOS = 'startup-flow'
node scripts/compare-case-interactions.mjs C:/path/to/before/dist C:/path/to/after/dist C:/path/to/startup-review
Remove-Item Env:QUALITY_SCENARIOS
```

При `QUALITY_TRACE=1` сохраняются отдельные CDP traces и окна действия (tracing вносит overhead; результаты не объединять с обычными). `QUALITY_MODES=desktop` или `mobile` ограничивает режимы. Диагностический tiny-gallery заменяет все URL галереи, в том числе общую обложку карточки, и меняет intrinsic dimensions: это контроль затрат на изображения, а не визуально эквивалентная страница.

## Сравнение

До изменений сохраните исходный commit, `git status --short`, выводы `npm test`, `npm run lint`, `npm run build`, папку `dist` и результаты в отдельной папке `before` вне checkout. После изменений повторите команды, сохранив `after`. Не создавайте worktree только ради измерений. Для повторного анализа предоставлены исходные JSON текущего этапа.

Запускайте браузерные сценарии, взаимодействия и Lighthouse последовательно. Во время измерений не запускайте сборку, вторую копию браузера или другие тяжёлые процессы. Сравнивайте одинаковые версии Chrome/Lighthouse, сервер, throttling, viewport и холодный cache. Lighthouse очищает storage/cache между прогонами; не сохраняйте согласие cookie отдельно для performance-прогонов.

```powershell
node scripts/summarize-quality.mjs C:/path/to/before C:/path/to/after > $env:TEMP/ee-quality-medians.json
git diff --check
```

В JSON Lighthouse `network-requests` содержит порядок, приоритет, время и размеры запросов (waterfall); `long-tasks`, `lcp-discovery-insight`, `image-delivery-insight` и `cls-culprits-insight` помогают объяснить метрики. Не считайте уменьшение bundle или рост score доказательством ускорения.

## Короткая ручная проверка

1. На шести ширинах сравнить шапку, горизонтальную навигацию, переключатель, фотографии, кейсы и форму, включая длинное имя документа. Проверить отсутствие горизонтального overflow. В Header нет отдельного раскрывающегося меню.
2. Открыть напрямую `/`, `/solutions/btp`, `/cases`, `/contacts` и детальный кейс; перейти Back/Forward, проверить якоря и активные пункты.
3. Переключить несколько продуктов/услуг с заполненной формой и файлами; убедиться, что поля и документы сохраняются, тема соответствует новому направлению. Быстро уйти со страницы в момент перехода.
4. Открыть кейс, листать кнопками/стрелками/свайпом, проверить Tab/Shift+Tab, Escape, крестик и фон. На desktop восстанавливается исходная scrollY; на mobile карточка возвращается в видимую область.
5. Добавить несколько файлов, удалить и добавить повторно. Только с локальным API или mock проверить network error, 429 и 413, один POST при двойном клике и одинаковый submission_id при неизменном повторе.
6. Проверить сообщение успеха: начало скрытия через 5 s, удаление через 5.6 s; повторную отправку и уход со страницы во время запроса. Проверить cookie после принятия и reload.
7. Проверить клавиатуру, отсутствие новых console errors и failed requests. Ожидаемые ошибки mock API рассматривать отдельно. Не отправлять заявки в публичный API.

Публикация, merge и deploy в этот этап не входят.

## Дополнительный applied-throttling тест главной

Если нужно проверить simulated LCP отдельным измерением браузера, используйте сохранённые production-сборки до/после:

```powershell
node scripts/measure-observed-home.mjs C:/path/to/before/dist C:/path/to/after/dist
```

Скрипт сам поднимает Python SPA-серверы на портах 4176/4177, создаёт новый browser context и отключает HTTP cache для каждого из 12 прогонов. Он применяет CDP network/CPU throttling: mobile 412×823/DPR 1.75, RTT 150 ms, download 1638.4 Kbit/s, upload 675 Kbit/s, CPU×4; desktop 1440×900/DPR 1, RTT 40 ms, download/upload 10240 Kbit/s, CPU×1. `PerformanceObserver` наблюдает LCP, layout shifts и long tasks в течение 15 s после DOMContentLoaded. В конце проверяется загрузка Hero/шрифтов и стабильность LCP. Результаты — `observed-home.json`; их нельзя объединять с simulated Lighthouse в одну медиану. Если команда Python называется `py`, задайте `$env:QUALITY_PYTHON = 'py'`.

Для необязательной регенерации производных изображений имеется `scripts/optimize-quality-images.py` (Pillow 12.3.0). В приложении дополнительная зависимость не нужна: WebP-файлы уже сохранены. Исходные JPEG/PNG остаются на месте; сохраняются ICC-профили, full-resolution варианты и композиция, а `srcSet` выбирает меньшие варианты Hero/БТП под экран.
