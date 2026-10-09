# Повторная проверка взаимодействий frontend ЭЭ

Ветка `refactor/frontend-quality-performance`. Production-исходники `src` после предыдущего этапа не менялись. Сравнивались сохранённые production `before/dist` и `after/dist`; повторная сборка побайтно совпала с `after/dist`. Только локальные статические HTTP-серверы; backend, production-сервер/БД, SMTP, merge и deploy не использовались.

## Итог

Большое прежнее замедление открытия не воспроизводится на стабилизированной странице: mobile 40.4 → 39.1 ms, desktop 46.1 → 43.3 ms. Но в сценарии быстрого перехода desktop click → rAF-подтверждение закрытия хуже во всех семи парах: медиана 72.6 → 95.4 ms. Эта регрессия лабораторного показателя сохранена, а не исключена выбором лучшей серии.

Отдельный контроль с MutationObserver показывает, что DOM модального окна удаляется раньше rAF: медиана click → наблюдение удаления 21.1 → 18.5 ms; ожидание rAF после этой отметки 65.5 → 72.2 ms. В этой же серии click → rAF 80.3 → 96.5 ms. Разность медиан не равна медиане разностей; эти числа нельзя складывать для получения общего времени. Основная часть задержки closing rAF происходит уже после удаления окна. Поэтому исходный paintConfirmationMs ошибочно звучал как подтверждение завершённой отрисовки.

Установлена зависимость surrogate-метрики от ожидания браузерного кадра/порядка callback и дополнительной работы восстановления домашней страницы. В tracing after иногда выполняет дополнительные React scheduler callbacks; изолированная замена только Header на исходный даёт медиану 78.4 → 71.8 ms. Это частичный эффект, а не доказательство, что все 22.8 ms вызваны одной строкой Header. Контрольный Header не перенесён в production: он возвращает старые недостатки очистки таймеров и scroll listener. Точный источник оставшейся вариации compositor/VM и frame scheduling не локализован до строки исходника.

При этом Event Timing duration имеет другое направление: в startup-серии desktop closing медиана максимальной duration событий 168 → 96 ms, в серии MutationObserver 176 → 88 ms. Это отдельная browser-reported Event Timing duration (квантование 8 ms), не полный INP и не завершение всех paint/анимаций/загрузок. Подтверждённого замедления самого удаления DOM/обработчика клика не получено; production-код не исправлялся по одному rAF-показателю.

## Исправленная методика

- Перед действием после scroll/preparation drain takeRecords() и очистка буферов; данные предыдущего действия не сохраняются.
- Capture pointerdown фиксирует inputStart, click — clickCaptureTime. Окно заканчивается первым rAF, обнаружившим ожидаемый DOM. domStateConfirmationMs — click capture → rAF; inputToDomStateMs дополнительно включает время до capture.
- Event Timing: startTime/processingStart/processingEnd/duration/interactionId, ненулевые interactionId и startTime только внутри окна. В runner нет других параллельных пользовательских действий. События меньше порога 16 ms могут отсутствовать; пустой список не означает нулевую задержку.
- Long tasks: только пересекающие [inputStart, rAF end], включая пересечение задачи, начавшейся раньше. overlapMs ограничен окном. Это временная ассоциация, не доказательство причинности каждой задачи.
- Дополнительные 350 ms для доставки observer не включены в окно. Event duration может заканчиваться позже окна: это duration именно выбранного input, а не задача после действия.
- domMutationConfirmationMs отмечает DOM-состояние через MutationObserver; rafSamplingDelayMs отделяет ожидание rAF. null означает отсутствие подходящей DOM-мутации. Эти поля добавлены в отдельной диагностической серии; результаты разных instrumentation-серий не объединены.
- decode() запрашивается после rAF confirmation; clickToDecodeResolvedMs — отдельное время разрешения promise. Оно не подтверждает paint; у самой диагностики тоже есть overhead.

## Условия и отдельные значения

Chromium 151.0.7922.173. Headless Linux, 390×900 и 1440×900/DPR1, без CPU/network throttling; mobile здесь означает ширину viewport, не реальный телефон. Одинаковый HTTP/1.0 Python-сервер без сжатия. Новые contexts на вариант; routing одинаково отключает HTTP cache и блокирует внешние/API-запросы. Before/after чередуются по чётности run. Не менее семи прогонов каждого обычного варианта; tracing — отдельные пять.

Settled: home → anchor → карточка, затем networkidle, шрифты/декодирование уже загруженных фоновых img и 500 ms стабилизации. Natural — первая установка галереи; predecoded — все 12 фотографий заранее decode/retain, после клика новых img requests 0; tiny-gallery — URL галереи, включая общую обложку карточки, заменены на 1×1 PNG. Tiny меняет intrinsic dimensions и внешний вид; не является чистым экспериментом только decoder. Startup: fonts + 800 ms → измеряемый anchor → open → следующая фотография → close; без дополнительного networkidle/background decode. Между действиями только описанная доставка observer/готовность фото.

Значения в ms, в порядке run; медиана и min–max считаются по неокруглённым значениям. Sample SD сохранён в all-case-summary.json.

### Быстрый переход: семь прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| desktop / startup-flow / case-close | before | 72.6, 70.4, 71.5, 73.1, 72.7, 63.4, 82.1 | 72.6 | 63.4–82.1 |
| desktop / startup-flow / case-close | after | 98.5, 132.2, 88.0, 95.4, 79.0, 118.2, 88.3 | 95.4 | 79.0–132.2 |
| desktop / startup-flow / case-open | before | 58.5, 53.7, 52.4, 299.5, 39.1, 48.2, 55.4 | 53.7 | 39.1–299.5 |
| desktop / startup-flow / case-open | after | 99.1, 72.8, 64.6, 56.0, 48.2, 41.1, 52.5 | 56.0 | 41.1–99.1 |
| mobile / startup-flow / case-close | before | 69.7, 61.4, 46.7, 52.5, 55.2, 32.3, 52.9 | 52.9 | 32.3–69.7 |
| mobile / startup-flow / case-close | after | 42.3, 33.1, 50.5, 42.8, 34.4, 36.8, 47.9 | 42.3 | 33.1–50.5 |
| mobile / startup-flow / case-open | before | 38.6, 66.4, 57.2, 43.1, 45.2, 39.4, 42.9 | 43.1 | 38.6–66.4 |
| mobile / startup-flow / case-open | after | 39.2, 63.7, 54.3, 34.8, 41.0, 42.6, 31.3 | 41.0 | 31.3–63.7 |

### Стабилизированная страница и контроль фотографий: семь прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| desktop / natural / case-close | before | 73.1, 68.5, 106.0, 79.8, 242.6, 80.7, 80.5 | 80.5 | 68.5–242.6 |
| desktop / natural / case-close | after | 86.7, 93.1, 66.9, 71.9, 94.9, 79.2, 105.0 | 86.7 | 66.9–105.0 |
| desktop / natural / case-open | before | 46.1, 33.5, 44.0, 54.8, 63.1, 38.3, 57.5 | 46.1 | 33.5–63.1 |
| desktop / natural / case-open | after | 67.4, 39.3, 59.7, 43.0, 42.2, 70.2, 43.3 | 43.3 | 39.3–70.2 |
| desktop / predecoded / case-close | before | 84.7, 91.6, 70.8, 81.2, 78.6, 73.6, 90.2 | 81.2 | 70.8–91.6 |
| desktop / predecoded / case-close | after | 83.9, 69.7, 111.7, 89.7, 70.3, 75.4, 76.5 | 76.5 | 69.7–111.7 |
| desktop / predecoded / case-open | before | 52.6, 48.8, 56.6, 36.0, 51.3, 60.3, 63.8 | 52.6 | 36.0–63.8 |
| desktop / predecoded / case-open | after | 62.8, 39.6, 45.1, 36.7, 44.9, 58.4, 52.6 | 45.1 | 36.7–62.8 |
| desktop / tiny-gallery / case-close | before | 77.2, 67.4, 74.3, 90.4, 121.0, 77.6, 79.8 | 77.6 | 67.4–121.0 |
| desktop / tiny-gallery / case-close | after | 120.1, 78.0, 78.7, 81.6, 79.2, 95.2, 79.1 | 79.2 | 78.0–120.1 |
| desktop / tiny-gallery / case-open | before | 52.7, 45.9, 55.1, 52.6, 101.9, 47.1, 45.6 | 52.6 | 45.6–101.9 |
| desktop / tiny-gallery / case-open | after | 45.2, 55.8, 45.4, 46.5, 45.9, 49.8, 56.4 | 46.5 | 45.2–56.4 |
| mobile / natural / case-close | before | 55.1, 35.8, 45.3, 61.4, 61.2, 34.6, 51.8 | 51.8 | 34.6–61.4 |
| mobile / natural / case-close | after | 32.2, 40.5, 53.5, 65.2, 33.4, 41.2, 51.3 | 41.2 | 32.2–65.2 |
| mobile / natural / case-open | before | 40.4, 59.7, 32.2, 44.4, 39.3, 50.1, 39.2 | 40.4 | 32.2–59.7 |
| mobile / natural / case-open | after | 39.1, 51.8, 38.6, 37.5, 44.2, 43.8, 38.8 | 39.1 | 37.5–51.8 |
| mobile / predecoded / case-close | before | 50.4, 45.3, 24.0, 32.6, 44.7, 55.2, 32.4 | 44.7 | 24.0–55.2 |
| mobile / predecoded / case-close | after | 37.5, 50.9, 35.8, 58.5, 56.9, 55.7, 53.9 | 53.9 | 35.8–58.5 |
| mobile / predecoded / case-open | before | 39.6, 39.5, 33.3, 43.0, 30.6, 40.7, 53.1 | 39.6 | 30.6–53.1 |
| mobile / predecoded / case-open | after | 76.6, 47.9, 51.2, 51.4, 62.8, 39.7, 34.6 | 51.2 | 34.6–76.6 |
| mobile / tiny-gallery / case-close | before | 49.0, 45.4, 51.0, 45.5, 40.0, 47.6, 54.0 | 47.6 | 40.0–54.0 |
| mobile / tiny-gallery / case-close | after | 63.8, 37.9, 49.4, 33.4, 32.7, 34.5, 46.8 | 37.9 | 32.7–63.8 |
| mobile / tiny-gallery / case-open | before | 36.2, 34.7, 40.7, 69.0, 85.8, 35.4, 35.5 | 36.2 | 34.7–85.8 |
| mobile / tiny-gallery / case-open | after | 45.0, 43.8, 39.2, 43.2, 37.3, 49.1, 59.7 | 43.8 | 37.3–59.7 |

### Отдельный tracing mobile predecoded: пять прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| mobile / predecoded / case-close | before | 36.1, 39.8, 37.0, 51.4, 39.9 | 39.8 | 36.1–51.4 |
| mobile / predecoded / case-close | after | 32.3, 57.8, 37.5, 47.0, 58.5 | 47.0 | 32.3–58.5 |
| mobile / predecoded / case-open | before | 50.7, 49.6, 51.5, 32.4, 39.7 | 49.6 | 32.4–51.5 |
| mobile / predecoded / case-open | after | 34.2, 40.2, 32.9, 62.1, 39.4 | 39.4 | 32.9–62.1 |

### Отдельный tracing desktop startup: пять прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| desktop / startup-flow / case-close | before | 75.0, 106.6, 75.1, 73.9, 133.5 | 75.1 | 73.9–133.5 |
| desktop / startup-flow / case-close | after | 73.8, 156.3, 83.5, 89.8, 104.1 | 89.8 | 73.8–156.3 |
| desktop / startup-flow / case-open | before | 51.2, 60.4, 63.1, 49.2, 46.2 | 51.2 | 46.2–63.1 |
| desktop / startup-flow / case-open | after | 50.8, 97.0, 52.8, 58.7, 208.3 | 58.7 | 50.8–208.3 |

### Отдельная серия DOM observer: семь прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| desktop / startup-flow / case-close | before | 80.3, 200.3, 23.3, 78.6, 120.7, 74.2, 92.8 | 80.3 | 23.3–200.3 |
| desktop / startup-flow / case-close | after | 78.0, 96.5, 253.6, 100.3, 89.2, 107.9, 93.5 | 96.5 | 78.0–253.6 |
| desktop / startup-flow / case-open | before | 49.2, 60.3, 212.5, 43.7, 233.3, 39.4, 51.8 | 51.8 | 39.4–233.3 |
| desktop / startup-flow / case-open | after | 61.6, 48.1, 120.6, 129.2, 76.8, 69.9, 67.8 | 69.9 | 48.1–129.2 |

Дополнительные поля той же DOM observer серии:

| Действие | Вариант | DOM mutation: значения; median; min–max | rAF после DOM: значения; median; min–max |
|---|---|---|---|
| case-close | before | 14.8, 21.1, 21.7, 13.1, 13.8, 60.9, 56.8; **21.1**; 13.1–60.9 | 65.5, 179.2, 1.6, 65.5, 106.9, 13.3, 36.0; **65.5**; 1.6–179.2 |
| case-close | after | 15.7, 61.6, 18.5, 9.3, 17.0, 18.7, 31.0; **18.5**; 9.3–61.6 | 62.3, 34.9, 235.1, 91.0, 72.2, 89.2, 62.5; **72.2**; 34.9–235.1 |
| case-open | before | 47.4, 55.0, 206.6, 41.8, 224.7, 37.6, 47.0; **47.4**; 37.6–224.7 | 1.8, 5.3, 5.9, 1.9, 8.6, 1.8, 4.8; **4.8**; 1.8–8.6 |
| case-open | after | 58.4, 45.6, 62.6, 127.0, 64.4, 63.7, 61.5; **62.6**; 45.6–127.0 | 3.2, 2.5, 58.0, 2.2, 12.4, 6.2, 6.3; **6.2**; 2.2–58.0 |

### Изолированный контроль Header

В этой таблице before означает текущую after-сборку, after — отдельную сборку after с одним исходным Header. Остальные исходники и фотографии одинаковы. Контроль сделан в /tmp/ee-header-control; никаких изменений src в рабочей ветке.

### After против after с исходным Header: семь прогонов

| Width / сценарий / действие | Вариант | Отдельные значения, ms | Медиана | Min–max |
|---|---|---|---:|---|
| desktop / startup-flow / case-close | before | 91.5, 31.8, 82.4, 75.1, 73.1, 78.4, 82.1 | 78.4 | 31.8–91.5 |
| desktop / startup-flow / case-close | after | 71.8, 72.3, 71.3, 68.9, 77.6, 83.2, 71.7 | 71.8 | 68.9–83.2 |
| desktop / startup-flow / case-open | before | 54.5, 54.1, 48.0, 45.2, 50.0, 46.9, 62.4 | 50.0 | 45.2–62.4 |
| desktop / startup-flow / case-open | after | 54.5, 66.0, 50.4, 67.7, 47.2, 57.3, 48.6 | 54.5 | 47.2–67.7 |

## Влияние фотографий

Все 12 URL/байтов галереи before/after идентичны по SHA-256 (build-manifest.json). Первое фото — cover-LRg-2u4m.jpg, 959×1280; это та же обложка, уже показанная в карточке. Во всех основных natural/startup открытиях оно complete к DOM-confirmation (7/7 для каждого mode/phase). Два новых запроса после открытия — соседние 33-DiDBjxPP.jpg и 01-paZ0mQxh.jpg, около 54/60 KB. Главная/WebP-карточки вне галереи изменялись на предыдущем этапе; их фоновая загрузка/paint остаётся отличием production builds.

| Условия | Mobile: decode-ready median before → after, ms | Desktop: before → after, ms |
|---|---:|---:|
| natural | 49.7 → 51.1 | 58.4 → 58.3 |
| predecoded | 48.5 → 60.2 | 61.9 → 54.4 |
| tiny-gallery | 47.9 → 48.3 | 58.6 → 55.7 |

Startup decode-ready medians: mobile 53.2 → 49.9 ms; desktop 70.3 → 67.1 ms. Наличие preload соседей/предварительного decode не даёт устойчивого направления разницы: mobile predecoded open 39.6 → 51.2 ms в обычной серии, 49.6 → 39.4 ms в отдельном tracing. Их нельзя объединять. Гипотеза, что большой прежний open-delay вызван скачиванием начального фото, не подтверждена. Decode-ready и DOM confirmation измеряются от одного click и не складываются.

## Общий runner и проверки

Исправленный interaction-quality.mjs повторно выполнен на обеих сохранённых сборках: 42 действия на вариант (3 runs × 2 widths × 7 actions), including Header, gallery, entity, topic, documents. Все окна и interactionId/long task overlap проверены. Полные результаты — before/interactions.json, after/interactions.json. Эти три прогона не смешиваются с целевыми семью; Event Timing больше не накоплен за страницу.

Последние проверки: npm test 14/14; npm run lint — 0 errors/warnings; npm run build успешно; node --check всех четырёх runner/helper/fixture; git diff --check. Реальный browser fixture test-interaction-timing.mjs проверил предыдущий slow click, измеряемый slow click и late task: предыдущие события и последующая задача исключены, текущий interactionId и пересекающаяся задача включены; DOM observer ≤ rAF.

Browser-results.json before/after — сохранённые результаты предыдущего этапа (46 и 53 checks соответственно). Полный 53-check screenshot runner в этом продолжении не запускался: production src не менялись, а новая сборка побайтно совпала с уже проверенной after. Новые browser measurements/fixture выполнены на реальных сохранённых builds.

## Lighthouse и applied throttling главной: разные эксперименты

Сохранённые предыдущие данные; по три прогона отдельно каждого метода. Lighthouse simulated оценивает граф сетевых/CPU зависимостей из trace исходной загрузки, а applied CDP действительно задерживает сеть/CPU и фиксирует LCP PerformanceObserver. Реальный порядок загрузки/конкуренция ресурсов, декодирование, frame scheduling и CSS paint не обязаны совпадать с моделью. Например desktop Lighthouse before по runs 3.331/1.729/1.740 s, after 2.137/1.741/2.094 s: вариация заметна и здесь. Конкретный вклад каждой части расхождения не установлен одним набором трёх прогонов.

| Метод | Mobile LCP, s | Desktop LCP, s |
|---|---:|---:|
| Lighthouse simulated | 10.02 → 9.74 | 1.74 → 2.09 |
| Applied CDP / observed | 12.23 → 6.14 | 2.86 → 1.05 |

Ухудшение simulated desktop сохранено. Общая медиана между методами не вычисляется; applied-ускорение не заменяет менее благоприятный simulated результат. Saved summary.json содержит все 8 mode/page pairs; lighthouse-numeric-runs.json содержит каждое значение и настройки. observed-home.json — полный отдельный набор 12 observations.

## Ограничения

- Небольшие n=7/5/3, одна VM/версия Chromium и лабораторный input. Никаких полевых INP, confidence intervals, Firefox/Safari/реального телефона/Windows прогонов.
- DOM mutation и rAF sampling не доказывают paint/завершение 220–240ms анимаций. Event Timing принадлежит выбранному input, но не описывает полную визуальную готовность приложения.
- Tracing и MutationObserver вносят overhead. Все серии выделены отдельно. Оставшаяся вариация frame/compositor/VM scheduling не отнесена к конкретной строке production кода.
- Обычный Header-контроль изолирует компонент целиком, а не только один state update; уменьшение median 6.6 ms не объясняет весь startup rAF gap.
- Галерея первого featured кейса проверена подробно; выводы о её задержках не автоматически распространяются на каждый кейс/галерейную фотографию.
- Backend/API/SMTP/production DB не проверялись; для измерений внешний трафик/API блокируется. Реальный сервер не использовался; только локальная статическая раздача сохранённых builds.

## Изменённые файлы этого продолжения

- scripts/interaction-quality.mjs — ограничение событий/задач действием и безопасный локальный base.
- scripts/interaction-timing.mjs — общий capture/observer helper с отдельной DOM mutation отметкой.
- scripts/compare-case-interactions.mjs — парные 7-run/scenario сравнения, фото и необязательный tracing.
- scripts/test-interaction-timing.mjs — проверка scope в реальном браузере.
- docs/frontend-quality-report.md — пометка исторической ошибочной атрибуции и ссылка на продолжение.
- docs/frontend-quality-windows.md — воспроизведение/точные определения новых полей.
- docs/frontend-interaction-review.md — этот отчёт.
- docs/frontend-quality-review.zip — компактные числовые результаты для скачивания из репозитория.

## Компактный архив

[frontend-quality-review.zip](frontend-quality-review.zip): summary before/after, все numeric Lighthouse runs, corrected before/after interactions.json, целевые interactions.json и отдельные diagnostic series, observed-home.json, browser-results.json, fixture/build manifest, отчёт, Windows instructions и 4 маленьких runner/helper source files. PNG, фотографии, dist и зависимости отсутствуют. SHA-256 каждого вложения — SHA256.json. Исторические накопленные event/task массивы не включены.

Архив включён в `ee_site/frontend/docs/frontend-quality-review.zip`, чтобы результаты можно было скачать непосредственно из GitHub. При первоначальной выдаче `/mnt/data` был недоступен; числовые таблицы поэтому также приведены в этом отчёте.
