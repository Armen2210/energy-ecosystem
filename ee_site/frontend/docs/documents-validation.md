# Страница «Документы»: реализация и локальная проверка

Дата проверки: 31.10.2026. Production не изменялся.

## Исходная рабочая копия

Начальный git status чистый. Ветка облачной копии — `work`, HEAD:
`413ff414c1f5a9ec08fb517095ec6f4029a66fc4` (Merge PR #53,
`desctop-mobile-photo-adaptation`). Origin — `Armen2210/energy-ecosystem`.
Владелец сообщил этот же SHA для `feature/ee-documents`; полное совпадение
проверено до изменения кода. Ветка не переключалась; commit/push/merge/deploy
не выполнялись. Начальная удалённая проверка не прошла через sandbox proxy,
поэтому соответствие исходной ветке установлено по SHA, сообщённому владельцем.

## Реализация

- `/documents`: один H1, вводный текст, категория H2, четыре названия H3.
  Порядок — БМК, БТП, ВНС, ПНС. Оба варианта опросника скачиваются: «Скачать Excel»
  и «Скачать PDF», без новой вкладки. Назначение каждого файла показано рядом
  с действием; формат и точный размер остаются доступны. Поведение задано у
  конкретного варианта в реестре, будущие PDF могут использовать `open`.
- Данные — категория → логический документ → варианты. Непустые категории
  выводятся в согласованном порядке, пустые не создают заголовков/заглушек.
  Проверен пример будущего сертификата с единственным PDF.
- Desktop: одна общая белая подложка, 24px radius, 32px padding, линии между
  строками. Tablet/mobile: прозрачная категория без рамки/тени, названия над
  действиями; до 640px Excel и PDF расположены вертикально.
- Образец — `/about`: `.about-page` (24px 0 36px),
  `.about-page__heading` (26px 0 24px), размеры/line-height H1 и вводного текста;
  mobile — 16px сверху и 22px 0 20px у heading. Использован существующий
  `.container`, Onest/Golos Text и токены цветов. `.site`, `.container`,
  глобальные стили, Footer CSS и Header не изменены.
- В существующей навигации футера ссылка «Документы» следует после «О нас».
  Якорь `footer-documents`. Возврат `/#footer-documents` устанавливает scroll
  непосредственно в useLayoutEffect и фокус с preventScroll. Для Back из
  документов сохранён только ключ исходной записи главной; существующая логика
  изделий, услуг, контактов и модальных объектов не заменялась.
- `/documents` добавлен в Router, publicRoutes и ограниченные safePath/
  page_category allowlists. Собственные title/description/canonical/index.
  HTML, sitemap и nginx allowlist генерируются одним существующим pipeline.
  Файлы не включаются в sitemap страниц. Новых целей/вызовов document_selected
  и изменений флага аналитики нет.
- Проверка prerender разрешает только зарегистрированные файловые URL,
  проверяет реальные байты, формат, размер и SHA-256; неизвестный путь с PDF/XLSX
  по-прежнему считается ошибкой. Скопированные в dist файлы также проверяются.
- Nginx-пример ограничивает location публичным documents и PDF/XLSX, сохраняет
  MIME, наследуемые headers и реальные 404. Префикс без ^~ позволяет сохранить
  канонический redirect `/documents/`. Private storage/обработчики backend
  не подключались и не изменялись.

## Источник и целостность восьми файлов

Источник — восемь приложений **текущего задания владельца**:
`BMK_questionnaire.xlsx/.pdf`, `BTP_questionnaire.xlsx/.pdf`,
`VNS_questionnaire.xlsx/.pdf`, `PNS_questionnaire.xlsx/.pdf`.
Кандидаты из предыдущих рабочих каталогов не использованы.
Разрешённые операции: только побайтовое копирование и переименование в
`public/documents/questionnaires/{bmk,btp,vns,pns}/ee-{slug}-questionnaire.{xlsx,pdf}`.
SHA-256 исходника, public-копии и GET из nginx совпали для каждого файла.
Размер в реестре — точные байты; UI единообразно округляет КБ/МБ до одного
десятичного знака (1024 байта/КБ). Запрос для получения размера не выполняется.

| Документ | Байт | SHA-256 источника и публичной копии |
| --- | ---: | --- |
| BMK · XLSX | 19242 | `a780155fe1fd3306c74b6508e89d30851e9e5a9b8bb1046f4e2cc08b9d2a0c7e` |
| BMK · PDF | 78882 | `3383be58db536b0ba6456edf730e4440c58285234ffef4801622bc622d98ded6` |
| BTP · XLSX | 72888 | `b11b3cfecf75998b5aeea82418a6d3e0af47ace8987a01f5cdafa285a9f928c6` |
| BTP · PDF | 155849 | `77ed365d1512436d80634b046e901aaadf03738b4bf9f8593b13e64a7e1a7a90` |
| VNS · XLSX | 10874 | `80d16a9c20770c32376c3e3440d33f9e3b9c9a891ed9806783595ac5fe3d3bf1` |
| VNS · PDF | 46537 | `35df838cc1505d08b038c599e3bd74429a8f14fb6b139cd1e12d2d60e78c2517` |
| PNS · XLSX | 11837 | `43d69ac0557ce693a25cb727e1058d46f2dd07c10ab1f4c724f9ded99d12b83e` |
| PNS · PDF | 48561 | `39a93cd83d53be85352143fcdb6d8f901026732cb11ccb874a904cb0e825621d` |

В public добавлены только эти восемь файлов. Нет оригиналов старых ОЛ,
тестовых заполнений, B/W PDF, генераторов или проверочных изображений.
Инженерное содержимое книг и PDF не пересобиралось и не редактировалось.

## Проверки первоначальной реализации (предыдущий этап)

- `npm test`: **44 passed**, 0 failed/skipped. Включены четыре целевых теста
  реестра/файлов/будущего PDF-only документа/allowlists.
- `npm run lint`: exit 0.
- `VITE_EE_ANALYTICS_ENABLED=false npm run build`: exit 0,
  **20 публичных HTML + отдельная 404**, обязательная проверка артефактов.
- `VITE_EE_ANALYTICS_ENABLED=false npm run test:prerender`: **8 passed**,
  0 failed/skipped; custom outDir, отрицательные примеры и registered file links.
  Флаг выключен одинаково для основной и проверочной сборки.
- `SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs` с внешними
  NGINX_BIN/NGINX_MIME_TYPES/PLAYWRIGHT_MODULE/CHROME_PATH: **8 passed**.
  Настоящий nginx из официального `nginx:stable-alpine`, временные конфиги и
  localhost upstream, dist read-only; проверка `nginx -t` и GET/HEAD.
- Все восемь файлов: статус 200, точный Content-Length, правильный MIME,
  SHA-256 GET; HEAD без тела. PDF без attachment, Excel действительно скачан
  браузером с правильным именем и SHA-256 до выбора cookies. Отсутствующие
  документы и неизвестные страницы — 404, не SPA fallback; server header
  наследуется. Прямой `/documents`, `/documents/` redirect, query, готовый HTML,
  canonical, sitemap и reload проверены.
- В общем nginx-fixture выполнены текущие `technical-seo-browser.mjs`,
  `prerender-browser.mjs`, `privacy-form-browser.mjs`, `documents-browser.mjs`:
  no-JS/delayed-JS, hydration, старые маршруты, modal, policy tab и новые файлы.
- Новый documents browser набор: **16 групп**, 0 JS/console ошибок и внешних
  HTTP/POST. Ширины **360, 390, 640, 641, 768, 960, 961, 1440**; фон и снятие
  карточки, длинные названия, 200% текст на 390px, отсутствие overflow,
  keyboard/focus, Excel→PDF→следующий документ, доступные имена и новая вкладка.
  Проверены direct/reload, возврат к футеру, Back/Forward и Back после reload;
  реальные кадры Home без промежуточного Hero и без второго скачка scroll.
  Нативный hash-возврат без JavaScript проверен после завершения прокрутки.
- Существующий `browser-quality.mjs`: **53 группы**, 0 неожиданных ошибок.
  Продукты/переключатель, формы/файлы/черновик, отмена scroll, modal/focus/Escape,
  Back/Forward и cookie UI; ответы формы перехвачены локальными mock-ответами.
- Сравнение исходного и нового manifest: title и description всех ранее
  существовавших страниц сохранены. Проверены неизменность ProductPage,
  LeadForm, API/черновика, Header, общих CSS, Footer CSS и backend через git diff.
- `git diff --check`: exit 0; HEAD остался исходным.

В исходном HEAD обнаружен устаревший отрицательный тест с отсутствующей ссылкой
`/solutions` на главной; ошибка подтверждена в отдельном git archive снимке.
Его mutation заменена реальной ссылкой и усилена проверкой факта изменения HTML.
Browser-сценарии также переведены на действующую карточку БМК и кнопочный
переключатель. Между Back/Forward quality-тест ожидает завершения загрузки
изображений, чтобы искусственная смена маршрута не обрывала ещё текущую загрузку;
проверки ошибок не отключены. Во всех наборах проверяются именно новые артефакты.

## Изменённые пути

Относительно `ee_site/`:

- `frontend/src/data/documents.js`.
- `frontend/src/pages/DocumentsPage/{DocumentsPage.jsx,DocumentsPage.css,index.js}`.
- `frontend/public/documents/questionnaires/{bmk,btp,vns,pns}/` — восемь файлов.
- `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/prerender/routes.js`.
- `frontend/src/components/Footer/Footer.jsx`,
  `frontend/src/components/ScrollToTop/ScrollToTop.jsx`.
- `frontend/src/analytics/policy.js` — только две allowlists известного маршрута.
- `frontend/scripts/document-files.mjs`, `frontend/scripts/documents.test.mjs`,
  `frontend/scripts/documents-browser.mjs`.
- `frontend/scripts/prerender.mjs`, `frontend/scripts/prerender-validation.mjs`,
  `frontend/scripts/prerender.test.mjs`, `frontend/scripts/prerender-browser.mjs`.
- `frontend/scripts/technical-seo-http.test.mjs`,
  `frontend/scripts/technical-seo-browser.mjs`, `frontend/scripts/browser-quality.mjs`.
- `frontend/package.json` — добавлен только существующий Node test runner path;
  зависимости и package-lock не изменены.
- `deploy/nginx_technical_seo.conf.example`, `deploy/README.md`,
  `frontend/README.md`, `frontend/docs/documents-validation.md`.

## Визуальная приёмка и границы

Отдельно переданы полные PNG 1440px и 390px и фрагмент футера. Они являются
проверочными изображениями, не включены в public. Дополнительные размеры
сохранены в JSON-отчёте browser-набора. Облик и контрольные размеры проверены
в Chromium; другие движки и ручной screen reader здесь не проверялись.
Доступные имена проверены в DOM, порядок Tab и focus — реальной клавиатурной
автоматизацией. Внешних HTTP-запросов, запросов Метрики, настоящих POST в API
и SMTP не было.

Production vhost/TLS/CDN и внедрение не выполнялись и не подтверждены этими
локальными проверками. Требуется визуальная приёмка владельца. Страницы изделий,
электронные опросники, LeadForm/черновик, API, backend и почта не изменялись.


## Точечная корректировка действий после визуальной приёмки

Изменены только `src/data/documents.js`,
`src/pages/DocumentsPage/DocumentsPage.jsx`, `scripts/document-files.mjs`,
`scripts/documents.test.mjs`, `scripts/documents-browser.mjs`, этот отчёт и README.
Сравнение SHA-256 с состоянием перед корректировкой подтверждает неизменность
CSS, Header/Footer, ScrollToTop, маршрутизации, nginx и всех восьми файлов.

Варианты всех четырёх опросников получили `behavior: download`:
«Скачать Excel» / «Скачать PDF», без target/rel и текста о новой вкладке.
Назначения хранятся у варианта файла и показаны отдельной строкой:
«Для заполнения на компьютере» / «Для печати и заполнения от руки».
Формат и размер сохранены. Доступное имя содержит действие и изделие,
назначение и метаданные связаны с ссылкой через aria-describedby.

Текст категории:
«Скачайте опросный лист для заполнения или передачи специалисту.
Excel — для заполнения на компьютере, PDF — для печати».

Скачивание задаётся HTML-атрибутом download конкретной same-origin ссылки.
Глобальный Content-Disposition: attachment для PDF не добавлен. Вариант PDF
с `behavior: open` по-прежнему использует открытие в браузере; отдельные
unit-сценарии подтверждают допустимость такого PDF для сертификатов, писем
и СОУТ. Пустые будущие категории не выводятся.

Проверки текущей корректировки (выполнены заново):

- `npm test`: 44 passed; `npm run lint`: exit 0.
- Build с выключенной аналитикой: 20 публичных HTML + 404; prerender: 8 passed.
- Изолированный настоящий nginx: GET/HEAD восьми файлов, MIME, размеры,
  SHA-256, отсутствие принудительного Content-Disposition и реальные 404.
- Chromium действительно скачал **четыре PDF и четыре XLSX**: имена файлов
  совпали с ee-{bmk,btp,vns,pns}-questionnaire.{pdf,xlsx}, размеры и SHA-256
  каждого скачанного файла совпали с неизменными исходниками. Новых вкладок
  не появилось, исходная страница осталась открытой.
- Проверены реальные доступные имена всех восьми ссылок, связанные назначения,
  отсутствие target/текста новой вкладки, keyboard/focus и все восемь ширин.
  Повторены существующие SEO, prerender/no-JS/delayed-JS и privacy browser-наборы
  на том же fixture. Данные о 53 quality-сценариях выше относятся к предыдущему
  этапу и не выдаются за повторный прогон этой точечной корректировки.
- Новые проверочные изображения переданы отдельно; файлы сайта не менялись.
  Ручной screen reader и другие движки не проверялись. Production не изменён;
  commit/push/deploy не выполнялись.


## Добавление сертификатов партнёрства и СОУТ

После приёмки действий опросников добавлены шесть PDF: четыре партнёрских
свидетельства/сертификата и СОУТ 2026/2022. Теперь отображаются три непустые
категории, десять документов и четырнадцать файловых ссылок. Опросники сохранили
скачивание; новые PDF открываются в новой вкладке. Остальные категории скрыты.

Исходники, проверки поворота всех восьми страниц СОУТ без перекодирования,
актуальные размеры/SHA-256, результаты текущего этапа и порядок замены СОУТ 2022:
[documents-pdfs-validation.md](documents-pdfs-validation.md).
Результаты более ранних этапов выше не являются повторным прогоном этого этапа.
