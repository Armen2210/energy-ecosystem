# Технический SEO-аудит ЭЭ

Дата локальной проверки и попытки сверки официальных источников: **10 октября 2026**.
Ветка: `fix/ee-technical-seo`, база/HEAD: `5298d73537d22ecc0a6430291dce83a0d740080e`.
`git fetch origin main` подтвердил совпадение с актуальным `origin/main`.
HEAD — merge PR №46; изменения аналитики `3550a55` и `5576853` присутствуют.
Исходная ветка называлась `work`, дерево было чистым. Создана запрошенная ветка,
исходные изменения пользователя не перезаписывались. Commit/push/PR/merge/deploy,
production migrate, изменение аккаунтов и публичные POST не выполнялись.

Локальные исправления и проверки завершены; серверное внедрение не выполнялось.
**Production HTTP проверен read-only до внедрения**: известные и отсутствующие
страницы получают общую HTML-оболочку и 200. Исправленное поведение проверено
отдельно на локальном nginx. Документы Google, Яндекса и Perplexity прочитаны
10.10.2026; политики OpenAI/Anthropic полностью прочитать не удалось (точные
результаты ниже). Первоначальный CONNECT 403 для внешних сайтов перестал
воспроизводиться на части hosts; это не объявляется публикацией среды или сайта.
Нужные домены добавлены в сетевой черновик; сохранение не доказывает применение
всех настроек или публикацию.
## 1. Подтверждённые технические препятствия

Проверены frontend/backend README, актуальные frontend-quality/analytics
документы, App/main, Seo, страницы/data/components, index/analytics-frame,
robots/sitemap, Vite, существующий nginx-шаблон защиты заявок. Отдельной
актуальной SEO-документации и полной конфигурации раздачи ЭЭ до этого этапа
в репозитории не было. Старые отчёты использовались как направления проверки.

| Проблема | Подтверждение текущего исходного состояния | Исправление | Проверка |
| --- | --- | --- | --- |
| SPA fallback маскирует отсутствующие URL | Vite и read-only production GET: HTTP 200 у неизвестного URL, изделия, услуги, кейса, /404 и исторических URL. Полный действующий EE vhost отсутствует | Отдельный nginx allowlist известных страниц; остальные 404 через 404.html | Реальный локальный nginx 1.26.3, HTTP suite и browser direct/reload |
| Неизвестный кейс исчезает за перенаправлением | CasePage/CaseModal: Navigate /cases; браузер /cases/missing → /cases | NotFoundPage; невалидный modal background не используется; отсутствуют masking redirects | Browser: URL остаётся /cases/missing; direct/reload 404; forged background не скрывает ошибку |
| У неизвестного изделия/услуги остаётся SEO главной или предыдущей страницы | Собственные inline-заглушки без Seo; direct title/canonical главной, при переходе возможны stale tags | Общая NotFoundPage, noindex, follow; canonical и og:url удаляются | Direct/reload, затем переход на известную страницу: index/canonical восстановлены |
| Ошибка имеет canonical /404 и нет noindex | NotFoundPage из HEAD; baseline DOM | Нет canonical ошибки; noindex в DOM, исходном 404.html | HTTP + DOM; произвольный отсутствующий URL не канонизируется на существующую страницу |
| Общая HTML-оболочка канонизирует все страницы на главную | Исходный index.html и production HTML всех 19 маршрутов содержат один canonical / и og:url / | Неправильные общие canonical/og:url удалены; Seo создаёт правильные после маршрутизации | Исходный HTML проверен отдельно; DOM у всех 19 страниц имеет свой canonical |
| Основной текст и уникальные metadata отсутствуют без JS | В исходном HTML существующих страниц пустой root, общие title/description; FAQ только после JS | В этом этапе не внедрены prerender/SSR. Ограничение сохранено и обосновано ниже | HTTP source отдельно от DOM; не объявляется исправленным |
| Нет H1 у About, Solutions, Services, Cases, Privacy и пяти прямых кейсов | Baseline browser по всем sitemap URL | Видимые существующие заголовки повышены до H1; CaseView: H1/H2 на прямой странице, H2/H3 в modal | 19 публичных страниц: один непустой видимый H1; typography/geometry сравнение с HEAD |
| Каталоги пропускают уровень H2; есть пустые H2 | Карточки h3 после h1; SectionHeader без title генерирует пустой h2 | Карточки каталога H2, на главной H3; вместо пустых headings декоративная линия aria-hidden | DOM не содержит пустых H1–H3; старые размеры/подчёркивания сохранены |
| /solutions и /services не доступны обычной ссылкой с главной; связи кейсов не показаны | Меню ведёт на home anchors, product/service карты — на детали; relatedProductSlug/relatedServiceSlugs записаны, но не используются в навигации | Компактные ссылки на оба реестра с главной; ссылки кейса на существующие связанные изделия/услуги | href-граф всех публичных страниц: внутренние page-ссылки ведут на существующие URL |
| Нет Twitter metadata и явного восстановления robots | Seo обновляет только существующие description/OG/canonical элементы | Seo создаёт недостающие теги, обновляет OG/Twitter/robots, восстанавливает head при Back/Forward и закрытии modal | 19 уникальных title/description; OG/Twitter согласованы; modal/close/Back/Forward |
| Служебный analytics-frame может индексироваться как страница | Исходный frame без robots meta; в sitemap его уже нет | noindex, nofollow в HTML; файл остаётся доступен | GET 200, robots meta noindex; код согласия и iframe gating не менялись |
| Нет стабильных идентификаторов структурированных сущностей | Organization/FAQ без @id; FAQ соответствует items | Organization #organization; FAQ URL и #faq соответствующего известного маршрута; безопасная JSON serialization | JSON parses; Organization одинаков на страницах; каждый FAQ question/answer совпадает с доступным ответом |

robots.txt и sitemap сами по себе ошибок по текущему набору публичных страниц
не показали и **не менялись**. Sitemap содержит 19 существующих канонических
URL; отсутствуют aliases, /404, frame, API/admin. У нужных страниц нет случайного
noindex. OG image — существующий общий og-image.jpg; новых обещаний/изображений
изделий в metadata не добавлено.

Organization содержит уже существующие имя, URL, телефон, email и locality/
region/country; контакты и реквизиты присутствуют в видимом содержимом сайта.
Адрес/география, рейтинги, цены, сертификаты, свойства продукции не придумывались.
FAQ допускает раскрытие пользователем, а JSON-LD содержит те же вопросы/ответы;
наличие разметки не означает допуск к расширенному поисковому результату. **Google FAQ rich result уже отменён**: официальный
changelog сообщает прекращение показов с **7 мая 2026**, а бывшая FAQPage doc
перенаправляет на [запись об удалении документации](https://developers.google.com/search/updates#removing-faq-rich-result).
Существующая согласованная FAQPage сохранена как описательная schema.org-разметка;
она не обязательна для AI-поиска и не обещает FAQ snippet Google.

## 2. Исправления и результаты этого этапа

### HTTP и маршруты

«Получено» ниже относится к **локальному nginx с текущим dist и точным
nginx_technical_seo.conf.example**, не к Vite и не к production. Известные страницы
также открыты браузером и перезагружены. В nginx HTTP suite проверены варианты
с query. Canonical ниже — DOM, без query/hash; у исходного общего HTML canonical
нет, уникальный canonical создаётся после JS.

| URL | Ожидаемый HTTP | Production до внедрения | Локальный nginx direct / reload | Canonical / robots DOM локально | H1 локально |
| --- | --- | --- | --- | --- | --- |
| `/` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/about` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions/bmk` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions/btp` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions/vns` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions/pns` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/solutions/automation-cabinets` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/services` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/services/design` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/services/construction-installation` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/services/commissioning` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases/bmk-sports-complex` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases/btp-food-production` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases/btp-hotel-complex` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases/btp-residential-complex` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/cases/btp-industrial-facility` | 200 | 200 | 200 / 200 | свой URL; index | 1 |
| `/privacy` | 200 | 200 | 200 / 200 | свой URL; index | 1 |

| URL/сценарий | Ожидаемый HTTP | Получено локально | Результат |
| --- | --- | --- | --- |
| /missing | 404 | 404 direct/reload | Сообщение об ошибке, noindex; без redirect/canonical |
| /solutions/missing | 404 | 404 direct/reload | То же |
| /services/missing | 404 | 404 direct/reload | То же |
| /cases/missing | 404 | 404 direct/reload | То же, не /cases |
| /404 | 404 | 404 direct/reload | Понятная ошибка, не индексируемая landing page |
| /about-us | 404 до подтверждения исторической замены | 404 direct/reload | Не объявлена автоматически заменой /about |
| /raskhodomery | 404 | 404 direct/reload | Такой продукции/страницы в текущем каталоге нет |
| /missing/, /missing.html, /cases/btp-hotel-complex/extra, /About, /SOLUTIONS/bmk | 404 | 404 | Проверена nginx suite, без masking redirect; регистр Router согласован с allowlist |
| /contacts?utm_source=local и /contacts/ с тем же query | 301 → /?utm_source=local#contacts | 301 → 200 | Query/anchor сохранены; canonical /; client alias также поддержан |
| Каждый существующий URL с trailing slash | 301 → URL без slash | 301 | Query сохранён; неизвестный slug не перенаправляется |
| /index.html | 301 → / | 301 | Та же HTML-оболочка главной, подтверждённая техническая нормализация |
| robots.txt, sitemap.xml, favicon.svg, og-image.jpg, manifest | 200 | 200 | Доступны независимо от public-route allowlist |
| analytics-frame.html | 200 | 200 + noindex | Служебный доступ сохранён; аналитика default off |
| Существующий /assets/*.js; отсутствующий asset | 200; 404 | 200; 404 | Нет blanket запрета assets |
| /api/leads/ GET; /admin/login/ GET в mock upstream | 429; 401 по sentinel fixture | 429; 401 | Сохранены upstream JSON, marker, Retry-After:17; дополнительно upstream 404 тоже остаётся JSON. Это test fixture, не production API |
| /static/test.css; /media/private-test в fixture | 204; 403 как задано fixture | 204; 403 | Чужие locations не перекрыты; доступа к приватным данным тест не создаёт |

### Отдельные наблюдения production до внедрения

| Production GET | Ожидаемый результат после внедрения | Получено сейчас | Исходный HTML / опубликованный JS |
| --- | --- | --- | --- |
| Все 19 URL sitemap | 200 | 200 | Одинаковая оболочка 5033 байта, canonical и og:url главной, пустой root; JS известной страницы создаёт её DOM/meta |
| /missing-seo-audit-20261010 | 404 | 200 | JS показывает ошибку; canonical /404, нет noindex |
| /solutions/missing-seo-audit | 404 | 200 | JS inline-заглушка, meta/canonical главной |
| /services/missing-seo-audit | 404 | 200 | То же |
| /cases/missing-seo-audit | 404, без redirect | 200 | JS переходит на /cases |
| /404, /about-us, /raskhodomery | 404 до подтверждения замены | 200 | JS показывает ошибку, canonical /404, noindex нет |
| /contacts и /contacts?utm_source=seo_read_only | HTTP 301 → /?utm_source=…#contacts | 200 | Redirect только клиентский; опубликованный bundle теряет query. Локальный main после PR46 и новый nginx query сохраняют |
| robots.txt, sitemap.xml | 200 | 200 | Wildcard public crawl и private API/admin Disallow; те же 19 sitemap URL |
| analytics-frame.html | 200 настоящего служебного файла | 200 HTML главной | На сервере отдаётся общая SPA-оболочка вместо frame; передать полный новый dist и применить точный location |

Реальные HTTP ответы получены urllib через проверяемый TLS, без POST/кабинетов.
Chromium не доверяет сертификату proxy среды для прямого внешнего TLS;
проверка опубликованного JS/DOM выполнена через локальный Playwright route
fulfillment **реальными production bytes, полученными urllib с TLS verification**.
URL/origin сохранены, API/admin/POST/внешние запросы не доставляются. Это
воспроизведение опубликованного bundle, не доказательство исправленного браузерного
поведения production. 13 representative URL разобраны таким способом; 0 JS errors.
Production status/source evidence: /workspace/seo-audit/production-routes.json;
DOM reproduction: /workspace/seo-audit/production-dom.json. После отдельного
внедрения всё равно требуется проверка настоящего браузера/HTTPS/CDN.

При **клиентском** SPA-переходе на отсутствующий URL статус уже полученного
HTML-документа не может быть изменён React. Проверено правильное представление
ошибки и noindex; реальный HTTP 404 проверен при отдельном запросе/reload nginx.
Это различие не скрывается утверждением «отрисована 404 — значит HTTP исправлен».

Смысловая замена /about-us, исторический статус /raskhodomery и возможные
серверные legacy redirects не установлены: нужны прежнее содержимое, архив/
старый CMS и реальные access logs. Не создавайте 301 на главную/каталог просто
ради обхода 404. Если владелец подтвердит эквивалентную страницу, добавьте один
адресный 301 и повторите таблицу. 410 также требует подтверждения удаления.

### Коррекция наследования nginx-заголовков

Локальные `add_header X-Robots-Tag` в `/404.html` и `/analytics-frame.html`
отменяли наследование существующих `add_header` уровня server на nginx 1.26.3.
Они удалены: `noindex` уже задан robots meta в соответствующем исходном HTML.
Это сохраняет заголовки server без копирования неизвестного production CSP,
новых директив наследования или требования обновить nginx. Для ответа 404
server-заголовок должен иметь `always`; шаблон не меняет существующую политику.
Целевой тест настоящего nginx задаёт `X-SEO-Server: inherited-always` на server
и проверяет его на `/about` (200), `/missing` и `/404.html` (404, включая internal
redirect), `/analytics-frame.html` (200). Проверки robots meta, статусов и
неизменённых JSON/Retry-After upstream API/admin сохранены.

В корректирующем этапе повторно выполнены HTTP suite (6 passed), совместный
nginx/browser suite (7 passed), `npm run lint` и `git diff --check`.
Остальные результаты таблицы относятся к основному этапу; HTML/JS/CSS сборки
в этой коррекции не менялись. Логи: `/workspace/seo-audit/correction-http.log`,
`correction-combined.log`, `correction-lint.log`; отдельный diff от состояния
перед коррекцией: `/workspace/seo-audit/corrective-diff.patch`.
Production, аккаунты и backend в корректирующем этапе не использованы и не менялись.

### Выполненные команды и функциональные проверки

| Проверка | Результат |
| --- | --- |
| npm test | 39 passed, 0 failed, 0 skipped |
| npm run lint | Успех, без ошибок и предупреждений финального запуска |
| npm run build (default analytics off) | Успех; index.html, 404.html, analytics-frame.html и assets |
| git diff --check | Успех |
| nginx -t (локальный fixture, 1.26.3) | syntax OK; configuration test successful |
| node --test scripts/technical-seo-http.test.mjs | 6 passed, 0 failed, 0 skipped; настоящий nginx, отдельный mock upstream; наследование server add_header always |
| SEO_BROWSER=true node --test scripts/technical-seo-http.test.mjs | 7 passed, 0 failed, 0 skipped: 6 HTTP групп и browser suite на одном временном nginx fixture |
| scripts/technical-seo-browser.mjs | 7 групп passed: 19 direct/reload, 9 missing, metadata/FAQ/hrefs, aliases, modal, Back/Forward, responsive |
| scripts/browser-quality.mjs | 53 checks passed: форма, файлы, направление, retry network/429/413, gallery/focus, timers, responsive |
| scripts/analytics-browser.mjs, default-off dist | 1 passed: даже разрешение не загружает счётчик при выключенном флаге |
| scripts/analytics-browser.mjs, отдельный enabled dist | 23 passed: согласие/отзыв, delayed callbacks, cross-tab, modal/direct, безопасные payload, real isolated loopback API и stable retry UUID |

Enabled build размещён вне checkout в /workspace/seo-audit/analytics-dist,
используется только regression runner. Все публично выглядящие URL, включая
Метрику, перехвачены. Synthetic POST идут лишь в отдельный loopback API
http://127.0.0.1:8000 с локальной облачной БД и console email из onboarding;
production API/БД/SMTP не использованы. Backend-код не менялся; его suite в этом
этапе повторно не запускалась, поскольку контракт и backend не затронуты.

SEO runner: 40 снимков (360, 390, 768, 961, 1440 px), без горизонтального overflow.
0 неожиданных JS/console ошибок; сетевые console сообщения 404 отсутствующих
документов ожидаемы и отделены от ошибок приложения. General quality runner
проверил также 640 и 960 px. Сравнение с отдельной сборкой чистого HEAD:
сохранены шрифты, размеры и геометрия существующих заголовков и FAQ/lead-heading
блоков; новые ссылки являются намеренным небольшим дополнением интерфейса.
Нет новых скрытых заголовков ради SEO. Уже имеющиеся screen-reader заголовки
FAQ/формы не заменяют видимые H1.

Полные значения metadata, headings, links и schema сохранены локальным runner
в /workspace/seo-audit/browser/results.json. Логи команд и проверки находятся
в /workspace/seo-audit; полный review patch, включая новые файлы, —
/workspace/seo-audit/full-diff.patch. Они артефакты проверки текущей сессии,
не runtime-зависимости приложения. Для новой машины повторите команды README.

### Изменённые файлы

Список ниже включает новые файлы, но не ignored dist/node_modules и внешние
артефакты. Backend, package.json, package-lock.json, robots.txt и sitemap.xml
не изменены.

- `ee_site/deploy/nginx_technical_seo.conf.example` (новый)
- `ee_site/frontend/404.html` (новый)
- `ee_site/frontend/README.md`
- `ee_site/frontend/analytics-frame.html`
- `ee_site/frontend/docs/analytics.md`
- `ee_site/frontend/docs/technical-seo-audit.md` (новый)
- `ee_site/frontend/index.html`
- `ee_site/frontend/scripts/technical-seo-browser.mjs` (новый)
- `ee_site/frontend/scripts/technical-seo-http.test.mjs` (новый)
- `ee_site/frontend/src/App.jsx`
- `ee_site/frontend/src/components/CaseCard/CaseCard.css`
- `ee_site/frontend/src/components/CaseCard/CaseCard.jsx`
- `ee_site/frontend/src/components/CaseModal/CaseModal.jsx`
- `ee_site/frontend/src/components/CaseView/CaseView.css`
- `ee_site/frontend/src/components/CaseView/CaseView.jsx`
- `ee_site/frontend/src/components/FAQ/FAQ.jsx`
- `ee_site/frontend/src/components/ProductCard/ProductCard.css`
- `ee_site/frontend/src/components/ProductCard/ProductCard.jsx`
- `ee_site/frontend/src/components/SectionHeader/SectionHeader.css`
- `ee_site/frontend/src/components/SectionHeader/SectionHeader.jsx`
- `ee_site/frontend/src/components/Seo/Seo.jsx`
- `ee_site/frontend/src/components/Seo/location.js` (новый)
- `ee_site/frontend/src/components/ServiceCard/ServiceCard.css`
- `ee_site/frontend/src/components/ServiceCard/ServiceCard.jsx`
- `ee_site/frontend/src/main.jsx`
- `ee_site/frontend/src/pages/AboutPage/AboutPage.jsx`
- `ee_site/frontend/src/pages/CasePage/CasePage.css`
- `ee_site/frontend/src/pages/CasePage/CasePage.jsx`
- `ee_site/frontend/src/pages/CasesPage/CasesPage.css`
- `ee_site/frontend/src/pages/CasesPage/CasesPage.jsx`
- `ee_site/frontend/src/pages/EntityPage.css`
- `ee_site/frontend/src/pages/HomePage/HomePage.jsx`
- `ee_site/frontend/src/pages/NotFoundPage/NotFoundPage.jsx`
- `ee_site/frontend/src/pages/PrivacyPage/PrivacyPage.jsx`
- `ee_site/frontend/src/pages/ProductPage/ProductPage.jsx`
- `ee_site/frontend/src/pages/ServicePage/ServicePage.jsx`
- `ee_site/frontend/src/pages/ServicesPage/ServicesPage.jsx`
- `ee_site/frontend/src/pages/SolutionsPage/SolutionsPage.jsx`
- `ee_site/frontend/vite.config.js`

## 3. Поиск с ответами ИИ, агентный доступ и содержание

### Три разных механизма

1. **Поисковая индексация**: обнаружение URL, crawl/render, HTTP-статус,
   canonical, правила индексации и решение поисковой системы включить страницу.
   После применения шаблона нужны наблюдения в Яндекс Вебмастере/Search Console.
2. **Получение страницы ИИ-crawler**: отдельный user-agent/сервис может читать
   только HTTP HTML, иначе обрабатывать JS или иметь свою политику robots.
   Пустой root известных страниц — подтверждённое ограничение для клиента без JS.
   Поисковая индексация не доказывает доступ такого crawler и цитирование.
3. **Использование агентом**: браузерный агент может выполнить JS и переходить
   по href. Это не разрешение работать с API заявок/admin/private documents и
   не доказательство использования в поисковых ответах.

Текущая robots-политика: User-agent:*, Allow:/, Disallow:/admin/ и /api/;
ссылка на canonical sitemap. CSS/JS/images и публичные страницы не запрещены.
Специальных правил для Google/OpenAI/Anthropic/Perplexity/Yandex не было и не
добавлено. Read-only UA-пробы /solutions/bmk с заголовками
Googlebot, YandexBot, PerplexityBot вернули 200 и ту же общую HTML-оболочку.
Это подтверждает ответ на **наши** запросы с этими UA, а не доступ настоящих
ботов с их IP. Статусы IP/WAF/реальные visits по-прежнему требуют server logs. Robots — инструкция совместимым клиентам, не контроль авторизации;
noindex и запрет обхода также не взаимозаменяемы. Приватные storage/admin/API
не открывались и не включались в sitemap. WAF/CDN/IP restrictions, фактические
запросы внешних ботов и их способность рендерить JS неизвестны без сервера/logs.

Для браузера структура теперь включает видимые H1, каталоги, обычные ссылки,
отдельные stable canonical URLs, связанные направления кейсов и согласованную
Organization/FAQ. Важные разделы products/services/cases имеют текстовые
описания, task/work lists и FAQ/accordion answers после JS; фото имеют alt/
подписи. Тексты описывают контекст, но не заменяют отсутствующие точные данные
на схемах/фото, технические документы и подтверждённые параметры. Наличие блока
с именем AiSummary или meta summary само по себе не означает поддержку ИИ.

### Официальные источники и актуальность

Сверка **10.10.2026**, без изменения robots-политики или кабинетов.
Успех загрузки документа — подтверждение прочитанной политики, не подтверждение
посещения сайта соответствующим ботом. Нет массовых allow/deny изменений.

| Сервис / механизм | Подтверждённое назначение и управление | Официальный источник и результат |
| --- | --- | --- |
| Googlebot | Поисковый crawl/render/index: Google ставит 200 в очередь рендеринга, использует rendered HTML; не все боты исполняют JS. У ошибок нужен настоящий 404; meta noindex не заменяет авторизацию | [JS SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), HTTP 200, прочитано |
| Google-Extended | Это robots.txt **product token**, не отдельный HTTP UA. Управляет использованием для обучения Gemini и grounding в перечисленных Gemini/Vertex продуктах; не определяет inclusion/ranking Google Search | [Common crawlers, Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended), HTTP 200, прочитано |
| Google AI Overviews/AI Mode | Нужны обычная индексируемость и eligibility snippet; дополнительных технических требований/особого AI schema нет. Crawl/index/показ не гарантированы. Preview controls — nosnippet, data-nosnippet, max-snippet, noindex | [AI features](https://developers.google.com/search/docs/appearance/ai-features), [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), HTTP 200, прочитано |
| Google Organization/FAQ | Добавлять только применимые реальные сведения. FAQ rich result не показывается с 07.05.2026; FAQ schema не равна rich-result support | [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [FAQ removal](https://developers.google.com/search/updates#removing-faq-rich-result), HTTP 200, прочитано |
| YandexBot и специальные fetchers | YandexBot — основной индексирующий робот. Robots-group конкретного робота заменяет Yandex/*, поэтому добавление отдельного Allow без private Disallow может потерять прежние ограничения. Некоторые специальные fetchers не используют ограничения wildcard. Подлинность проверяется reverse + forward DNS / инструментом IP | [User-agent](https://yandex.ru/support/webmaster/ru/robot-workings/user-agent), [проверка роботов](https://yandex.ru/support/webmaster/ru/robot-workings/check-yandex-robots), HTTP 200, прочитано |
| Алиса AI в Поиске | Уточняет запросы и обращается к Поиску, опирается на релевантные качественные источники. Поисковый индекс, выбор источника и агентное посещение не одно действие. В прочитанных документах отдельный обязательный «Alice crawler UA» не установлен | [Как формируются ответы](https://yandex.ru/support/webmaster/ru/alice), [экспертность/полезность/оригинальность/содержательность](https://yandex.ru/support/webmaster/ru/epos), HTTP 200, прочитано |
| PerplexityBot | Discovery/ссылки в поисковых ответах, не сбор для foundation model training; robots.txt и опубликованные IP для проверки/WAF | [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), HTTP 200, прочитано |
| Perplexity-User | User-initiated fetch, не search crawl/training; по документации обычно игнорирует robots.txt. Robots не может служить защитой private documents | Тот же источник, прочитано |
| OpenAI: OAI-SearchBot/GPTBot/ChatGPT-User | Названия для отдельной сверки search/training/user fetch и robots controls; актуальные различия не объявляются проверенными | [Bots](https://platform.openai.com/docs/bots) отвечает 301 на [developers.openai.com/api/docs/bots](https://developers.openai.com/api/docs/bots); новый host пока CONNECT proxy 403 |
| Anthropic: ClaudeBot/Claude-SearchBot/Claude-User | Названия для отдельной сверки; актуальная политика не объявляется проверенной | [Официальная статья](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) отвечает HTTP 403; не обходили проверку доступа |

Рекомендация — сохранить нынешний public/private crawl split и подтверждать
реальные visits по server logs, отдельно от заявления о robots allowance.
Noindex добавлен только отсутствующим страницам и служебному frame; он не
запрещает browser fetch frame и не открывает private sections. Любое будущее
решение об обучении/индексации/агентном чтении принимать отдельно для конкретного
сервиса, с повторением private Disallow и сохранением авторизации.

В сетевой черновик добавлены developers.google.com, platform.openai.com,
openai.com, support.claude.com, docs.perplexity.ai, yandex.ru, llmstxt.org,
www.energoeffekt-rostov.ru, developers.openai.com, developer.chrome.com, web.dev.
Предыдущие custom rules/package-manager presets сохранены. Для применения
сохранённой конфигурации требуется проверить и сохранить настройки, затем
опубликовать облачную среду. Сохранение не объявляется публикацией; доступ к
некоторым docs уже подтверждён запросами, OpenAI/new agent-guide hosts пока
заблокированы proxy. Повторить только эти источники после применения настроек;
Anthropic 403 может требовать обычного ручного чтения официальной страницы.

### Яндекс Алиса и данные от владельца

Обычный sitemap, HTTP-коды, canonical, доступность text/JS и внутренняя навигация
относятся к Яндекс Поиску и подготовке его источников. По официальному описанию
Алиса AI строит ответ через уточнённые поисковые запросы, а выбор/порядок ссылок
не совпадает с порядком SERP и может меняться во времени. Это не гарантия источника.

Подтверждён актуальный инструмент Вебмастера
[«Видимость сайта в Алисе AI»](https://yandex.ru/support/webmaster/ru/service/alice-answers):
**Share of Voice**, динамика, «Примеры → Сайты», «Примеры → Запросы и страницы»,
фильтр «Запросы с моим сайтом» и скачивание запросов. По документации данные
за последние **3 месяца**, обновление **еженедельное**, выборка ограничена
запросами, где сайт уже достаточно высоко в обычном Поиске. Это не полный учёт
всех AI-обращений. «Пока недостаточно данных» не равно техническому запрету.
Документация прочитана, **кабинет ЭЭ и его показатели не открывались**.
Настройки Метрики/Директа не менялись; данные рекламы не доказывают индексацию.

Запросить у владельца, без передачи паролей/секретов:

- подтверждённую canonical www HTTPS property и права владельца в Вебмастере;
- выгрузку/снимки доступных разделов индексирования: известные/включённые/
  исключённые URL с причинами, последний обход и полученные HTTP-коды;
- результаты проверки robots и sitemap, время обработки, предупреждения/
  ошибки, ожидаемые 19 URL и статус выбранных новых/исправленных страниц;
- проверки representative URL: главная, изделие, услуга, кейс, исторический URL
  и случайный неизвестный URL; что робот получает и какой canonical определяет;
- diagnostics/security/server availability сообщения и crawler errors;
- поисковые запросы/показы/клики по URL до и после публикации, включая brand и
  non-brand; в Google Search Console — доступный Generative AI performance report
  согласно прочитанному Google guide; это поисковые данные, не доказательство цитирования Алисой;
- из «Видимость сайта в Алисе AI»: выбранный период (до 3 месяцев), SoV и
  динамику, доступный диапазон частоты упоминаний, «Примеры → Сайты»,
  «Примеры → Запросы и страницы», список с фильтром «Запросы с моим сайтом»;
  если данных недостаточно — точное сообщение и дата обновления. Существование
  инструмента подтверждено docs, его данные/доступность для property ЭЭ не проверены;
- обезличенные server/CDN logs по статусам/redirect chain, robots/sitemap,
  JS/assets и проверенным crawler UA/IP; не передавать тела заявок/вложения;
- отдельные воспроизводимые наблюдения ответов Алисы: дата, запрос, режим,
  видимый источник/URL, ссылка/скриншот. Единичный ответ не доказывает устойчивую
  видимость и не устанавливает причину изменения позиций.

Названия доступных разделов могут измениться; сверить фактический кабинет.
Ни одна из этих кабинетных проверок не объявляется выполненной.

### llms.txt

Файл не добавлен. [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
**прямо говорит**, что Google Search, включая generative AI, не использует
llms.txt и другие специальные AI text files: их наличие не помогает и не вредит
Google search visibility/ranking. Они не нужны для eligibility AI answers.

Прочитан [исходник предложения автора](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)
(v2, date-modified 10.08.2026). Это предложение Markdown-карты для agent reading,
а не универсальный обязательный стандарт поисковой индексации. Автор приводит
примеры developer-doc platforms и
[Chrome Lighthouse agentic audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt).
Последняя официальная Chrome страница пока CONNECT proxy 403, поэтому поддержку
этого конкретного audit нельзя объявить независимо сверенной; заявления автора
не подменяют проверку каждого vendor. Наличие llms.txt у developer docs провайдера
также не доказывает использование этого формата его search crawler на чужом сайте.

Практическая возможная роль для ЭЭ — компактная редакционная карта **публичных**
проверенных материалов для читающего её агента, если появится подтверждённый
потребитель/измеримая гипотеза. Сейчас она не исправит пустой HTTP root, статусы
или metadata. Нужны синхронизация URL и текстов при каждом изменении, владелец
сопровождения, parity/link tests; нельзя перечислять private/admin/API заявки.
Приоритет — доступный HTML, точные ответы покупателям и стабильные ссылки.
Файл не обязательный стандарт и не гарантированный путь в ответы.

### Пробелы содержания для отдельного этапа

В таблице вопросы к владельцу/инженерам, **не новые факты или рекламные обещания**.
Текущие описания/FAQ дают общую ориентацию; эти материалы требуют подтверждения.

| Направление | Какие подтверждённые материалы нужны |
| --- | --- |
| Характеристики | Диапазоны мощности/расхода/напора/температур и иных применимых параметров; варианты комплектации; единицы и условия измерения |
| Область применения | Подтверждённые типы объектов, исходные условия, критерии выбора между решениями; ссылки на реальные подходящие кейсы |
| Ограничения | Требования к помещению/площадке/сетям/воде/электропитанию, среде и обслуживанию; что не входит в стандартную поставку |
| Производство | Фактические этапы проектирования/сборки, контроль качества, фото с пояснениями; точные сроки только с условиями и источником |
| Испытания | Виды и условия испытаний, приемка, примеры разрешённых к публикации протоколов; не создавать фиктивные сертификаты |
| Документы | Публичные актуальные паспорта/опросные листы/чертежи/руководства, версия/дата и текстовое описание схем; не private uploads заявок |
| Поставка | Состав поставки, границы ответственности, монтаж/ПНР, упаковка/транспорт/гарантия только по согласованным реальным условиям |
| Кейсы | Задача → ограничения → выбранное решение → выполненные работы → подтверждённый результат; обезличенные параметры, источники/разрешение владельца |
| Вопросы покупателей | Реальные вопросы из продаж/инженерного отдела: исходные данные, подбор, стоимость и её факторы, сроки/обслуживание/замены; проверенные ответы |

Если ключевые сведения находятся только на фото/схеме, добавить нормальный
текст/таблицу и ссылку на разрешённый документ, а не SEO-невидимый текст.
Не выдумывать географию поставок, достижения, характеристики и результаты.

## 4. Будущие серверные действия, ограничения и HTML-стратегия

### Перед отдельным внедрением

1. Сверить sanitized текущий EE nginx vhost/версию и WAF/CDN; устранить конфликт
   прежнего blanket SPA fallback с новым allowlist. Проверить root, HTTPS и
   www canonical redirects. Шаблон не является полным production vhost.
2. Сохранить TLS, существующие API/admin/static/media locations, запреты private
   storage, trusted proxy headers, существующие server add_header и lead request protection. Не использовать
   proxy_intercept_errors для подмены API ошибок HTML. Согласовать /admin без
   slash с текущим backend/location; шаблон не меняет его routing policy.
3. Отдельно проверить исторические URL/эквивалентность по архиву и logs, только
   после этого добавлять конкретные смысловые 301 или подтверждённые 410.
4. Собрать с аналитикой по умолчанию off и корректным публичным API origin;
   передать dist целиком, включая 404.html, analytics-frame и assets. Настройки
   счётчиков/рекламных аккаунтов в этом этапе не меняются.
5. На целевом сервере выполнить nginx -t, затем отдельно согласованный reload;
   проверить реальные HTTPS 200/301/404, Location/query, source/DOM, /contacts,
   каждую страницу, файлы assets/robots/sitemap/frame и приватные границы.
6. Проверить CDN cache/status и очистку старых HTML после отдельного внедрения;
   невозможность публичного доступа к private files не доказывается robots.
7. После публикации повторить браузерные/серверные checks и наблюдать
   Вебмастер/Search Console, логи crawler, indexing/canonical/soft404 reports.
   Никакие positions/citation/growth outcomes не обещаны.

Сейчас неизвестны действующий vhost, server logs, WAF/IP restrictions, состояние
индекса/кабинетов, реальные crawler visits, SMTP/CDN и внешние валидаторы
structured data. Production HTTP **до** внедрения наблюдался; HTTP **после**
внедрения пока не может быть проверен, поскольку внедрение не выполнялось. Локальный nginx подтверждает поведение шаблона,
а не его успешное внедрение. Основной текст успешных страниц без JS по-прежнему
отсутствует; OG/Twitter по маршрутам доступны после JS, поэтому previews у
клиентов без JS могут оставаться общими. Это отдельное оставшееся ограничение.

### Нужны ли prerender или SSR

SSR/new framework в этом этапе **не внедрялись**. Нельзя назвать SPA автоматически
неиндексируемым только из-за JavaScript: наша проверка показывает наличие полного
DOM после JS, а фактический поиск/render надо смотреть у поисковых систем.
Тем не менее для чтения содержимого клиентами без JS и уникальных preview tags
есть конкретное подтверждённое основание улучшить исходный HTTP HTML.

| Вариант отдельной работы | Сложность и сопровождение | Маршруты / сборка | Ограничение |
| --- | --- | --- | --- |
| Генерация только route-specific head HTML | Низкая/средняя; единый registry метаданных, parity tests | 19 известные URL + отдельный error HTML; дополнительный build step | Поможет canonical/social previews, но не сделает основной текст доступным без JS |
| Build-time prerender полного публичного содержимого существующего React | Средняя; snapshots/head, hydration/startup, регрессии форм/consent/modal; не менять framework без причины | Генерация из реестра/data и sitemap; новые статические slugs при rebuild; 404 не должен превращаться в snapshot 200 | Нужен rebuild при изменении содержания; будущие динамические CMS URL потребуют иной стратегии/on-demand generation |
| SSR и смена архитектуры/framework | Высокая; серверный runtime, routing/data/cache, hydration и privacy regressions | Динамические URL возможны в runtime; меняет build/deploy | Для нынешних статических data не обоснован как обязательный шаг |

Рекомендация: отдельным этапом оценить **ограниченный build-time prerender
публичных страниц** с единым route registry. Он устранит ограничение чтения без
JS, не требует немедленной SSR-миграции и должен сохранить аналитику off,
согласие, формы и private boundaries. До реализации согласовать цели/поддержку,
проверить snapshots без персональных данных, исходные meta/text, HTTP statuses,
обновление dynamic slugs и regressions. Это не обещание включения в ответы ИИ.
