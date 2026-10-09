# Frontend ЭЭ: качество и измеренное быстродействие

Ветка `refactor/frontend-quality-performance`. Исходный commit `86771f6b916ce89b8262f6917814cf477fee6d7d`; исходная рабочая копия была чистой. Изменения ограничены `ee_site/frontend`. Backend, сайт ТД, production-сервер, зависимости и lock-файл не изменялись. Измерения выполнены до публикации commit/PR; merge и deploy не выполнялись.

## Что изменено

- Header: активный пункт внутренних страниц вычисляется из URL; домашняя секция обновляется scroll/resize-подпиской с одним rAF. Таймер логотипа отменяется при смене адреса и размонтировании; modifier-click сохраняет стандартное поведение ссылки.
- CookieBanner: согласие читается при инициализации state; повторного render из effect нет. При недоступном storage принятие всё равно закрывает баннер на текущий визит.
- EntitySwitcher: геометрия и sticky-offset синхронизируются напрямую с DOM; лишние React renders и неполные зависимости устранены. ResizeObserver учитывает размеры кнопок/шапки и смену шрифта. Измерения выполняются в обычном effect, чтобы не удлинять начальный commit перед paint. Таймер перехода отменяется при смене маршрута/повторном выборе/размонтировании; начальный нулевой индикатор сохранён.
- CaseView: смена slug сбрасывает только индекс галереи до нового render, без remount родительской страницы. Пустая gallery стабильна; глобальные стрелки не перехватывают ввод в текстовых полях. CaseModal сохранён и проверен браузером.
- LeadForm: изменение initialTopic обновляет только тему, сохраняя поля и файлы. Асинхронный ответ после unmount не создаёт state updates или новые таймеры. После успеха используется актуальная тема; существующие signature/submission_id и блокировка двойной отправки сохранены.
- TopicSelect/FileSelect: закрытие при disabled/пустом списке выполняется без нулевых таймеров. Таймеры сообщения об успехе и анимация прокрутки имеют cleanup; незавершённый scroll не продолжает управление после ухода со страницы.
- При загрузке `/contacts` URL нормализуется до `/#contacts` до первого render, сохраняя history.state. Для client-side перехода App сразу рендерит HomePage и заменяет URL; промежуточного footer-only кадра, вызывавшего большой CLS, нет. Начальная загрузка не требует повторного render главной.
- Шесть исходных фотографий получили WebP-копии quality 92 без изменения композиции/full-resolution размеров; JPEG/PNG сохранены, ICC-профили сохранены. Для Hero добавлены 480/780w, для БТП 720w через srcSet/sizes. Изображения первого экрана остаются eager; карточки сохраняют lazy. Размеры картинок/логотипов зарезервированы. Массового CSS-рефакторинга, повсеместной мемоизации, preload всех ресурсов или разделения маршрутов на чанки не было.

## Проверки

Baseline: `npm test` — 14/14, ESLint — 5 ошибок и 2 предупреждения, production build — успешно. После изменений: `npm test` — 14/14, `npm run lint` — 0 ошибок/0 предупреждений, `npm run build` и `git diff --check` — успешно. Node-тесты проверяют API/helper-функции; это не component tests.

Браузерный runner: 53 проверок прошли. Проверены прямые маршруты, redirect contacts, Back/Forward, сохранение формы/файлов при смене продукта, меню документов, удаление/повторное добавление, network error/429/413, одинаковый submission_id для неизменённого повтора и один POST при двойном клике. Проверены success timers 5/5.6 s, стрелки/свайп галереи, Tab/Shift+Tab, Escape, крестик и backdrop на desktop, повторное открытие и смена кейса, восстановление scroll, клавиатура TopicSelect, responsive-индикатор, отмена таймеров перехода/логотипа/прокрутки и недоступный storage.

Неожиданных browser/console errors и недоступных ресурсов: 0. Ожидаемые ошибки mock API сохранены отдельно. Отменённых запросов favicon при навигации: 0; отдельный запрос favicon вернул HTTP 200. Это отмены навигации, а не отсутствующий файл.

Визуальная проверка: 30 пар PNG — четыре страницы и форма с длинным именем документа на 360, 390, 640, 768, 960 и 1440 px. Во всех проверках отсутствует горизонтальный overflow. CSS bundle побайтно сохранён. Изображения перекодированы с потерями, поэтому пиксельная идентичность фотографий не заявляется; сравнение размеров/разностей — visual-comparison.json.

Различия размеров снимков: 960-btp.png: (960, 3409) → (960, 3410).

## Lighthouse: три прогона, медианы

Chromium 151.0.7922.173, Lighthouse 13.0.1, Playwright 1.57.0, Node 24.19.0. Локальные production-сборки, один Python SPA-сервер, HTTP/1.0 без gzip/Brotli, холодный cache/storage; запуски последовательные, без одновременной сборки/второго измеряющего браузера. VITE_API_BASE_URL — локальный 127.0.0.1:8000; browser API перехватывался mock. Заявки на публичный API, настоящий SMTP и production БД не использовались.

Mobile: Lighthouse default, 412×823/DPR 1.75, simulated RTT 150 ms, throughput 1638.4 Kbit/s, CPU×4. Desktop: 1440×900/DPR 1, simulated RTT 40 ms, 10240 Kbit/s, CPU×1. Точная configSettings записана в каждом JSON.

В каждой ячейке: до → после. MB — десятичные. Объём — навигационная загрузка до взаимодействий, включая lazy-ресурсы, которые Chromium считает близкими к viewport; это не только видимый первый экран.

### mobile

| Страница | LCP, s | FCP, s | CLS | TBT, ms | Загрузка, MB |
|---|---:|---:|---:|---:|---:|
| home | 10.02 → 9.74 | 4.13 → 4.10 | 0.00011 → 0.00011 | 33.5 → 16.5 | 9.44 → 3.96 |
| btp | 18.42 → 6.14 | 4.12 → 4.13 | 0.00011 → 0.00011 | 36.0 → 30.0 | 3.49 → 1.05 |
| cases | 7.19 → 7.61 | 4.21 → 4.10 | 0.02479 → 0.02479 | 8.0 → 5.5 | 1.62 → 1.62 |
| contacts | 10.19 → 9.31 | 4.17 → 4.10 | 0.48110 → 0.00011 | 41.5 → 36.5 | 10.09 → 4.61 |

### desktop

| Страница | LCP, s | FCP, s | CLS | TBT, ms | Загрузка, MB |
|---|---:|---:|---:|---:|---:|
| home | 1.74 → 2.09 | 0.82 → 0.82 | 0.00023 → 0.00023 | 0.0 → 0.0 | 10.38 → 4.89 |
| btp | 3.10 → 1.14 | 0.82 → 0.82 | 0.00006 → 0.00006 | 0.0 → 0.0 | 3.49 → 1.05 |
| cases | 1.32 → 1.28 | 0.82 → 0.82 | 0.00005 → 0.00005 | 13.0 → 0.0 | 1.62 → 1.62 |
| contacts | 1.81 → 1.76 | 0.82 → 0.82 | 0.53975 → 0.00023 | 2.5 → 7.0 | 10.38 → 4.89 |

Сырые network-requests содержат waterfall с временем/приоритетом/размерами. long-tasks, lcp-discovery-insight, image-delivery-insight и cls-culprits-insight сохранены в каждом JSON. Итог не опирается на Lighthouse score. Для маршрутов с ухудшившимися показателями ускорение не заявляется.

## Дополнительное observed-измерение главной

Это отдельный эксперимент PerformanceObserver с применённым CDP throttling, не смешанный с Lighthouse simulated. По три новых browser context на каждую пару mode/phase; HTTP cache disabled. Те же viewport/DPR; mobile CPU×4/RTT 150 ms/download 1638.4/upload 675 Kbit/s; desktop CPU×1/RTT 40 ms/download/upload 10240 Kbit/s. Наблюдение 15 s после DOMContentLoaded, проверена загрузка Hero/шрифтов и стабильность LCP в конце окна.

| Режим | observed LCP, s | observed FCP, s | Наибольшая задача, ms (медиана максимумов) |
|---|---:|---:|---:|
| mobile | 12.23 → 6.14 | 3.47 → 3.45 | 185.0 → 163.0 |
| desktop | 2.86 → 1.05 | 0.76 → 0.82 | 98.0 → 116.0 |

Расхождение simulated/observed LCP сохранено, а не скрыто выбором только лучшего результата. Уменьшение байтов не доказывает ускорение каждого показателя. Это лабораторные измерения, не полевой INP или оценка реальных посетителей.

## Взаимодействия

**Уточнение после повторной проверки:** ниже сохранён исторический замер трёх прогонов. Его click → rAF числа описывают обнаружение DOM-состояния перед paint, а не завершённую отрисовку. В исходном runner Event Timing накапливался за всю страницу, long tasks не имели верхней границы; эти исторические event/task данные нельзя использовать для атрибуции действия. Исправленная методика и повторные прогоны сохранены в [frontend-interaction-review.md](frontend-interaction-review.md). Новые результаты не объединяются с историческими.

По три независимых прогона для 390×900 и 1440×900/DPR 1, без CPU/network throttling, на production-сборках. Измерение от capture click до ожидаемого состояния на animation frame; оно включает намеренный switch delay 180 ms и не включает завершение плавного scroll. Сохранены Event Timing и long tasks. Малые различия и единичные длительные задачи на трёх прогонах не доказывают устойчивую разницу.

| Режим | Действие | Подтверждение, ms: до → после | Длительных задач в трёх прогонах: до → после |
|---|---|---:|---:|
| mobile | header-anchor | 8.0 → 9.9 | 0 → 0 |
| mobile | case-open | 46.6 → 88.1 | 0 → 2 |
| mobile | gallery-next | 24.3 → 11.9 | 0 → 0 |
| mobile | case-close | 52.4 → 31.9 | 1 → 0 |
| mobile | entity-switch | 197.5 → 198.5 | 0 → 0 |
| mobile | topic-open | 6.4 → 7.0 | 0 → 0 |
| mobile | documents-open | 8.5 → 10.2 | 0 → 0 |
| desktop | header-anchor | 10.9 → 11.2 | 0 → 0 |
| desktop | case-open | 53.1 → 94.8 | 1 → 1 |
| desktop | gallery-next | 56.4 → 48.0 | 0 → 0 |
| desktop | case-close | 62.8 → 110.4 | 0 → 0 |
| desktop | entity-switch | 200.1 → 196.4 | 0 → 0 |
| desktop | topic-open | 8.0 → 8.1 | 0 → 0 |
| desktop | documents-open | 11.1 → 9.2 | 0 → 0 |

## Размеры ресурсов

| Ресурс | До, bytes | После, bytes |
|---|---:|---:|
| Начальный .js | 428625 (gzip 112192) | 430442 (gzip 112989) |
| Начальный .css | 86238 (gzip 16602) | 86238 (gzip 16602) |
| hero.jpg → hero.webp | 513225 | 301220 |
| bmk-gigaterm-hero.png → bmk-gigaterm-hero.webp | 2025229 | 193638 |
| btp-energolain-hero.png → btp-energolain-hero.webp | 2649272 | 399626 |
| vns-aquarus-hero.png → vns-aquarus-hero.webp | 718525 | 372690 |
| pns-fire-hero.jpg → pns-fire-hero.webp | 486805 | 265776 |
| automation-cabinets-hero.png → automation-cabinets-hero.webp | 408910 | 161174 |
| hero-480.webp (480×313) | — | 50148 |
| hero-780.webp (780×508) | — | 109976 |
| btp-energolain-hero-720.webp (720×900) | — | 213158 |

gzip-числа — размер локального gzip-файла, не передача тестового сервера. JS немного увеличился; уменьшение JS bundle и ускорение всех страниц не заявляются.

## Ограничения и дальнейшая проверка

- FCP/TBT и simulated LCP изменились неодинаково. В таблицах сохранены все ухудшения; перед выпуском нужен профиль initial render на целевых устройствах, особенно mobile БТП/главной. Оставшийся startup/paint cost не объявлен исправленным только по уменьшению картинок.
- Три прогона дают медиану, но не доверительный интервал. Synthetic throttling/виртуальная машина/сервер без сжатия не воспроизводят весь production, OS cache и аппаратный GPU пользователя.
- Проверен headless Chromium на Linux. Windows, Firefox, Safari и реальные телефоны не проверялись. Инструкция и короткий ручной checklist — frontend-quality-windows.md.
- Browser form проверена с mock; реальный production backend, SMTP и БД не проверялись и не изменялись.
- Большие исходники сохранены для повторной обработки; обслуживаются WebP-версии. Responsive sizes намеренно приблизительны и могут выбрать немного больший файл, чем строго минимальный.
- Runtime/chunk-splitting/обработка ошибок загрузки нового чанка не менялись; новые route chunks не добавлены.

## Изменённые файлы первого этапа

Все пути относительно корня репозитория:

```text
ee_site/frontend/docs/frontend-quality-report.md
ee_site/frontend/docs/frontend-quality-windows.md
ee_site/frontend/scripts/browser-quality.mjs
ee_site/frontend/scripts/interaction-quality.mjs
ee_site/frontend/scripts/measure-observed-home.mjs
ee_site/frontend/scripts/measure-quality.mjs
ee_site/frontend/scripts/optimize-quality-images.py
ee_site/frontend/scripts/serve-quality.py
ee_site/frontend/scripts/summarize-quality.mjs
ee_site/frontend/src/App.jsx
ee_site/frontend/src/assets/automation-cabinets-hero.webp
ee_site/frontend/src/assets/bmk-gigaterm-hero.webp
ee_site/frontend/src/assets/btp-energolain-hero-720.webp
ee_site/frontend/src/assets/btp-energolain-hero.webp
ee_site/frontend/src/assets/hero-480.webp
ee_site/frontend/src/assets/hero-780.webp
ee_site/frontend/src/assets/hero.webp
ee_site/frontend/src/assets/pns-fire-hero.webp
ee_site/frontend/src/assets/vns-aquarus-hero.webp
ee_site/frontend/src/components/CaseView/CaseView.jsx
ee_site/frontend/src/components/CookieBanner/CookieBanner.jsx
ee_site/frontend/src/components/EntitySwitcher/EntitySwitcher.jsx
ee_site/frontend/src/components/FileSelect/FileSelect.jsx
ee_site/frontend/src/components/Header/Header.jsx
ee_site/frontend/src/components/Hero/Hero.jsx
ee_site/frontend/src/components/LeadForm/LeadForm.jsx
ee_site/frontend/src/components/ProductCard/ProductCard.jsx
ee_site/frontend/src/components/ScrollToTop/ScrollToTop.jsx
ee_site/frontend/src/components/TopicSelect/TopicSelect.jsx
ee_site/frontend/src/data/products.js
ee_site/frontend/src/main.jsx
ee_site/frontend/src/pages/HomePage/HomePage.jsx
ee_site/frontend/src/pages/ProductPage/ProductPage.jsx
```

Полный unified diff (включая binary patches WebP) и архив исходных JSON/снимков сохранены вне checkout в /workspace/ee-quality-results. Черновики экспериментов — intermediate-* и probe*; окончательное сравнение — before/after, summary.json и observed-home.json.

Компактные JSON-результаты и инструменты доступны в репозитории: [frontend-quality-review.zip](frontend-quality-review.zip). Повторная проверка взаимодействий и добавленные файлы описаны в [frontend-interaction-review.md](frontend-interaction-review.md).
