# Frontend сайта ООО «Энергоэффект»

Frontend-часть production-сайта ООО «Энергоэффект».

Проект развивается как инженерная B2B-платформа: производственные решения, продуктовые направления, услуги, реальные кейсы, сбор заявок, SEO/AEO/GEO-ready структура и основа для дальнейшего развития цифровой экосистемы.

---

## Production-статус

Сайт размещён в production.

Основной рабочий адрес:

```text
https://www.energoeffekt-rostov.ru
```

Домен без `www` перенаправляет на основной адрес:

```text
https://energoeffekt-rostov.ru
→
https://www.energoeffekt-rostov.ru
```

В production ранее проверено:

- frontend открывается;
- HTTPS работает;
- редирект с домена без `www` работает;
- внутренние React-маршруты открываются;
- прямые заходы на внутренние маршруты работают;
- SPA fallback настроен через nginx;
- `/contacts` перенаправляет пользователя к контактному блоку главной страницы;
- форма заявки отправляется;
- заявка сохраняется в backend и базе данных;
- файл заявки загружается и сохраняется;
- заявка отображается в Django Admin;
- email-уведомление менеджеру отправляется;
- email с вложением приходит;
- cookie-баннер работает;
- страница политики обработки персональных данных доступна;
- `robots.txt` доступен;
- `sitemap.xml` доступен;
- Яндекс Вебмастер подключён;
- Google Search Console подключён.

Последние frontend-изменения по кейсам, responsive-поведению и типографике проверены локально:

```text
npm run build — успешно
```

После следующего production-deploy необходимо повторно выполнить smoke-test основных маршрутов и прямых страниц кейсов.

---

## Основные production-маршруты

```text
/                                      Главная
/about                                 О компании
/solutions                             Продуктовые направления
/solutions/bmk                         Блочно-модульные котельные
/solutions/btp                         Блочные тепловые пункты
/solutions/vns                         Водопроводные насосные станции
/solutions/pns                         Пожарные насосные станции
/solutions/automation-cabinets         Шкафы управления и автоматизации
/services                              Услуги
/services/design                       Проектирование
/services/construction-installation    Строительно-монтажные работы
/services/commissioning                Пусконаладка и ввод в эксплуатацию
/cases                                 Реестр кейсов
/cases/:slug                           Просмотр отдельного кейса
/contacts                              Redirect на /#contacts
/privacy                               Политика обработки персональных данных
/privacy#cookies                       Раздел о cookies
*                                      Страница 404
```

Маршрут `/contacts` не используется как отдельная пользовательская страница:

```text
/contacts → /#contacts
```

Это позволяет вести пользователя сразу к форме заявки и контактной информации.

---

## Проверенные базовые маршруты

```text
/                                      ок
/about                                 ок
/solutions                             ок
/solutions/bmk                         ок
/solutions/btp                         ок
/solutions/vns                         ок
/solutions/pns                         ок
/solutions/automation-cabinets         ок
/services                              ок
/services/design                       ок
/services/construction-installation    ок
/services/commissioning                ок
/cases                                 ок
/contacts                              ок, redirect на /#contacts
/privacy                               ок
```

Прямые заходы ранее проверены для:

```text
/solutions/bmk
/services/design
/privacy
```

После внедрения детальных кейсов дополнительно требуется проверять прямые маршруты:

```text
/cases/bmk-sports-complex
/cases/btp-food-production
/cases/btp-hotel-complex
/cases/btp-residential-complex
/cases/btp-industrial-facility
```

---

## Контактные данные

```text
Телефон: +7 800 444-07-66
tel-ссылка: tel:+78004440766
Email: sales@ee-don.ru
```

---

## Состояние backend и сервера

Production backend работает через Django и Gunicorn.

Сервис:

```text
ee_site_gunicorn.service
```

Ранее проверено:

```text
ee_site_gunicorn.service — active (running)
```

Production backend использует:

- Django;
- Django REST Framework;
- Gunicorn;
- PostgreSQL;
- nginx как reverse proxy и сервер статических файлов.

Важно: `.env`, резервные копии `.env` и другие файлы с секретами не добавляются в Git и не коммитятся.

---

## Технологии frontend

Проект использует:

- React;
- Vite;
- React Router;
- обычные CSS-файлы без CSS Modules;
- Fontsource Variable;
- Onest Variable для заголовков;
- Golos Text Variable для основного текста;
- Django REST API для отправки заявок;
- nginx для production-раздачи frontend.

---

## Назначение проекта

Frontend решает не только задачу отображения сайта, но и задачу B2B-продаж.

Основные цели:

- показать ООО «Энергоэффект» как инженерную производственную компанию;
- понятно разделить продукты и услуги;
- показать реальные реализованные объекты;
- дать пользователю короткий путь к заявке;
- обеспечить понятность для неспециалиста;
- сохранить профессиональное доверие инженеров и проектировщиков;
- подготовить структуру под SEO, AEO и GEO;
- создать масштабируемую основу для будущего инженерного портала;
- обеспечить юридическую базу: политика персональных данных, согласие в форме, cookies и реквизиты компании.

---

## Продуктовые направления

Порядок продуктов фиксированный:

1. Блочно-модульные котельные.
2. Блочные тепловые пункты.
3. Водопроводные насосные станции.
4. Пожарные насосные станции.
5. Шкафы управления и автоматизации.

Важно: в рамках проекта ЭЭ аббревиатура **ПНС** означает **пожарные насосные станции**.

---

## Услуги

Услуги отделены от продуктов:

1. Проектирование.
2. Строительно-монтажные работы.
3. Пусконаладка и ввод в эксплуатацию.

Разделение продуктов и услуг важно для:

- UX;
- SEO;
- структуры заявок;
- будущей CRM-логики;
- фильтрации;
- машинопонятной AI-ready структуры.

---

## Структура проекта

```text
src/
  api/
    leadsApi.js

  assets/
    cases/
      bmk-sports-complex/
      btp-food-production/
      btp-hotel-complex/
      btp-residential-complex/
      btp-industrial-facility/

    hero.jpg
    energoeffect-logo-orange.svg
    bmk-gigaterm-hero.png
    btp-energolain-hero.PNG
    automation-cabinets-hero.PNG
    logo-gigaterm.png
    logo-energolain.png
    logo-aquarus.png

  components/
    AiSummary/
    CaseCard/
    CaseModal/
    CookieBanner/
    EntitySwitcher/
    FAQ/
    Footer/
    Header/
    Hero/
    InfoListBlock/
    LeadForm/
    ProductCard/
    ProductDetailsAccordion/
    ScrollToTop/
    SectionHeader/
    Seo/
    ServiceCard/
    TrustBlock/

  data/
    cases.js
    navigation.js
    products.js
    services.js

  pages/
    AboutPage/
    CasePage/
    CasesPage/
    ContactsPage/
    HomePage/
    NotFoundPage/
    PrivacyPage/
    ProductPage/
    ServicePage/
    ServicesPage/
    SolutionsPage/

  styles/
    variables.css
    global.css
    layout.css

  App.css
  App.jsx
  index.css
  main.jsx
```

---

## Data-файлы

### `src/data/products.js`

Единый источник данных для продуктов.

Используется в:

- карточках продуктов на главной;
- продуктовых страницах;
- переключателе продуктовых направлений;
- форме заявки;
- SEO-структуре;
- AI Summary;
- FAQ;
- JSON-LD FAQPage.

Каждый продукт может содержать:

```text
slug
title
shortTitle
switcherTitle
description
cardTitle
cardDescription
url
theme
heroImage
heroImageMode
heroImageAlt
lineLogo
lineLogoAlt
heroTitle
heroSubtitle
aiSummary
detailSections
features
useCases
faq
```

Поле `switcherTitle` используется для компактного отображения продукта:

```text
Блочно-модульные котельные          → БМК
Блочные тепловые пункты             → БТП
Водопроводные насосные станции      → ВНС
Пожарные насосные станции           → ПНС
Шкафы управления и автоматизации    → ШУиА
```

Поля `cardTitle` и `cardDescription` используются для коротких карточек на главной.

Поле `theme` является основой для будущей визуальной индивидуализации продуктовых страниц. На текущем этапе продукты используют единую фирменную систему сайта.

---

### `src/data/services.js`

Единый источник данных для услуг.

Используется в:

- карточках услуг на главной;
- сервисных страницах;
- переключателе услуг;
- форме заявки;
- SEO-структуре;
- AI Summary;
- FAQ;
- JSON-LD FAQPage.

Каждая услуга может содержать:

```text
slug
title
shortTitle
switcherTitle
description
cardTitle
cardDescription
url
theme
heroImage
heroImageMode
heroImageAlt
heroTitle
heroSubtitle
aiSummary
detailSections
features
useCases
faq
```

Компактные названия для переключателя:

```text
Проектирование                       → Проектирование
Строительно-монтажные работы         → СМР
Пусконаладка и ввод в эксплуатацию   → ПНР
```

---

### `src/data/cases.js`

Единый источник данных для кейсов.

Используется в:

- блоке избранных кейсов на главной;
- общем реестре `/cases`;
- модальном просмотре;
- прямых маршрутах `/cases/:slug`;
- галереях объектов;
- AI Summary кейсов.

Файл хранит:

- slug кейса;
- тип объекта;
- заголовок;
- краткое описание для карточки;
- подробное описание;
- метаданные объекта;
- cover-изображение;
- галерею;
- подписи и alt-тексты изображений;
- AI Summary;
- выполненные работы;
- особенности решения;
- признак показа на главной.

Логика выборок:

```text
cases          → все доступные кейсы
featuredCases  → избранные кейсы для главной
```

Точный контракт объекта необходимо смотреть непосредственно в актуальном `src/data/cases.js`.

---

### `src/data/navigation.js`

Единый источник данных для основной навигации.

Текущие пункты:

```text
Продукция → /#products
Услуги    → /#services
Кейсы     → /#cases
Контакты  → /#contacts
```

На внутренних страницах активный пункт определяется по маршруту:

```text
/solutions/* → Продукция
/services/*  → Услуги
/cases*      → Кейсы
/contacts    → Контакты
```

На главной активный пункт определяется по текущей секции:

```text
#products → Продукция
#services → Услуги
#cases    → Кейсы
#contacts → Контакты
```

---

## Главная страница

Главная построена как компактная B2B landing-страница:

1. Hero.
2. AI Summary.
3. Продуктовые направления.
4. Услуги.
5. Кейсы.
6. Контакты и форма заявки.
7. Footer.

Основные якорные секции:

```text
#products
#services
#cases
#contacts
```

Блоки «Инженерная экспертиза» и «Производственный процесс» удалены с главной, чтобы сократить путь пользователя и усилить фокус на:

- продуктах;
- услугах;
- реальных объектах;
- заявке.

---

## Карточки продуктов

Компонент:

```text
src/components/ProductCard/
```

Особенности:

- вся карточка кликабельна;
- используется реальное изображение направления;
- для БМК, БТП и ВНС может отображаться логотип линейки;
- для направлений без отдельной линейки используется технический маркер;
- используются короткие `cardTitle` и `cardDescription`;
- CTA «Подробнее» выполнен как текстовая ссылка со стрелкой;
- переход ведёт на соответствующую продуктовую страницу;
- реализованы hover- и leaving-состояния.

---

## Карточки услуг

Компонент:

```text
src/components/ServiceCard/
```

Особенности:

- вся карточка кликабельна;
- используется изображение услуги;
- убраны лишние дублирующие маркеры;
- используются короткие `cardTitle` и `cardDescription`;
- CTA «Подробнее» выполнен как текстовая ссылка со стрелкой;
- переход ведёт на соответствующую страницу услуги;
- визуально карточки услуг отделены от продуктовых.

---

## Кейсы

### Общая архитектура

Кейсы реализованы как полноценный пользовательский сценарий.

Доступны:

- избранные карточки на главной;
- общий реестр `/cases`;
- модальный просмотр поверх главной или реестра;
- адреса `/cases/:slug`;
- прямое открытие кейса по URL;
- галерея фотографий;
- AI Summary;
- метаданные объекта;
- выполненные работы;
- особенности решения;
- CTA для обращения.

Текущие реальные объекты:

- БМК — ФОК Элиста;
- БТП — молочное производство;
- БТП — объект в Анапе;
- БТП — объект в Дербенте;
- БТП — производственный объект.

Изображения находятся в:

```text
src/assets/cases/
```

Структура папок:

```text
src/assets/cases/
  bmk-sports-complex/
    cover.jpg
    01.jpg
    02.jpg
    ...

  btp-food-production/
    cover.jpg
    01.jpg
    02.jpg
    ...

  btp-hotel-complex/
    cover.webp
    01.webp
    02.webp
    ...

  btp-residential-complex/
    cover.webp
    01.webp
    02.webp
    ...

  btp-industrial-facility/
    cover.webp
    01.webp
    02.webp
    ...
```

---

### `CaseCard`

Компонент:

```text
src/components/CaseCard/
```

Используется:

- на главной;
- на странице `/cases`.

Карточка показывает:

- cover-фото;
- тип объекта;
- заголовок;
- краткое описание;
- CTA «Подробнее о проекте».

Карточка кликабельна и открывает кейс.

---

### `CaseModal`

Компонент:

```text
src/components/CaseModal/
```

Модальное окно открывается поверх:

- главной страницы;
- реестра `/cases`.

При открытии адрес браузера меняется на:

```text
/cases/:slug
```

Закрытие доступно через:

- кнопку-крестик;
- клик по фону;
- клавишу `Esc`.

Реализовано:

- блокирование фонового scroll;
- восстановление позиции после закрытия;
- возврат к исходному списку;
- галерея;
- стрелки переключения изображений;
- mobile-свайп;
- адаптивные размеры;
- компактные метаданные;
- CTA «Обсудить задачу»;
- отсутствие горизонтального смещения на mobile.

---

### Прямая страница кейса

Маршрут:

```text
/cases/:slug
```

Прямой заход не зависит от ранее открытой страницы и отображает отдельную оболочку кейса.

Реализовано:

- navigation-блок;
- контент кейса;
- галерея;
- адаптивный desktop/mobile layout;
- защита от горизонтального overflow;
- корректный vertical scroll;
- CTA для обращения;
- возможность вернуться к списку кейсов.

При добавлении нового кейса необходимо:

1. Добавить данные в `src/data/cases.js`.
2. Добавить папку изображений.
3. Проверить карточку на главной или `/cases`.
4. Проверить модальный просмотр.
5. Проверить прямой маршрут `/cases/:slug`.
6. Проверить mobile-свайп.
7. Обновить `sitemap.xml`, если страница должна индексироваться.

---

## Страница `/cases`

Компонент страницы:

```text
src/pages/CasesPage/
```

Назначение:

- показать полный список объектов;
- подтвердить реальный опыт компании;
- не перегружать главную;
- дать доступ к подробным карточкам объектов.

Страница содержит:

- navigation-блок;
- вводный блок;
- список всех кейсов;
- CTA «Обсудить похожую задачу».

При закрытии модального окна пользователь должен оставаться рядом с исходной карточкой, а не перемещаться в другую часть страницы.

---

## Product / Service Switcher

Компонент:

```text
src/components/EntitySwitcher/EntitySwitcher.jsx
src/components/EntitySwitcher/index.js
```

Используется:

- на продуктовых страницах;
- на страницах услуг.

### Переключатель продуктов

```text
БМК / БТП / ВНС / ПНС / ШУиА
```

Маршруты:

```text
/solutions/bmk
/solutions/btp
/solutions/vns
/solutions/pns
/solutions/automation-cabinets
```

### Переключатель услуг

```text
Проектирование / СМР / ПНР
```

Маршруты:

```text
/services/design
/services/construction-installation
/services/commissioning
```

### Mobile-поведение

На mobile переключатель работает как горизонтальная лента:

- элементы не переносятся на вторую строку;
- активный элемент остаётся видимым;
- вертикальный scroll не блокируется;
- blur, fade и chevron-подсказки не используются;
- лишнее автоматическое смещение продуктового переключателя устранено.

Анимация смены страниц через `opacity + translateX` была протестирована, но отложена из-за риска повлиять на существующие scroll-сценарии.

---

## Продуктовые страницы

Продуктовая страница включает:

- EntitySwitcher;
- Hero с изображением;
- логотип продуктовой линейки, если он задан;
- H1 и краткое описание;
- AI Summary;
- ProductDetailsAccordion;
- FAQ;
- форму заявки.

Варианты изображения задаются через `heroImageMode`.

Поддерживаются разные режимы:

- стандартный;
- cover;
- portrait;
- technical.

---

## Сервисные страницы

Сервисная страница включает:

- EntitySwitcher;
- Hero с изображением;
- H1 и краткое описание;
- AI Summary;
- подробные секции;
- FAQ;
- форму заявки.

Продукты и услуги не смешиваются внутри переключателей.

---

## Product Details Accordion

Компонент:

```text
src/components/ProductDetailsAccordion/
```

Используется для подробного содержания продукта.

Типовые секции:

- Обзор;
- Состав;
- Применение;
- Данные для расчёта.

Особенности:

- первая секция раскрывается по умолчанию;
- плюс нарисован средствами CSS;
- раскрытие выполняется плавно;
- предусмотрен `prefers-reduced-motion`;
- типографика адаптирована под desktop, tablet и mobile.

---

## FAQ

Компонент:

```text
src/components/FAQ/
```

FAQ используется как:

- пользовательский блок вопросов и ответов;
- SEO/AEO/GEO-структура;
- источник FAQPage JSON-LD.

На страницах с FAQ должен выводиться:

```html
<script type="application/ld+json">
```

Структура должна содержать:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage"
}
```

Проверка:

```text
DevTools
→ Elements
→ поиск application/ld+json
→ проверить "@type": "FAQPage"
```

---

## AI Summary

Компонент:

```text
src/components/AiSummary/
```

Используется:

- на главной;
- на продуктовых страницах;
- на сервисных страницах;
- в кейсах.

Назначение:

- кратко объяснить содержание страницы пользователю;
- повысить машинопонятность контента;
- подготовить сайт к AEO/GEO/AI-ready сценариям;
- дать быстрый ответ до изучения подробных секций.

AI Summary является видимым HTML-контентом. Скрытый SEO-текст не используется.

---

## Форма заявки

Компонент:

```text
src/components/LeadForm/LeadForm.jsx
```

API helper:

```text
src/api/leadsApi.js
```

Endpoint:

```text
POST /api/leads/
```

Передаются:

- имя;
- компания;
- телефон;
- email;
- интересующее направление;
- описание задачи;
- файл;
- `source_page`;
- `source_system`.

Реализовано:

- продукты и услуги подтягиваются из data-файлов;
- на продуктовой или сервисной странице направление подставляется автоматически;
- выбранное направление добавляется в описание заявки;
- success/error состояния;
- плавное скрытие success-сообщения;
- загрузка файла;
- сохранение заявки в базе данных;
- отображение заявки в Django Admin;
- email-уведомление менеджера;
- передача вложения в email;
- согласие на обработку персональных данных;
- ссылка на политику открывается в новой вкладке;
- используется `rel="noopener noreferrer"`;
- под полем файла отображается предупреждение о персональных данных третьих лиц;
- у основной кнопки сохранена чёрная рамка и заметный keyboard focus.

Предупреждение:

```text
Не прикрепляйте документы, содержащие персональные данные третьих лиц,
если у вас нет права на их передачу.
```

На продуктовых и сервисных страницах секция формы имеет якорь:

```jsx
<section id="lead-form" className="section section--contact">
```

---

## Production API

Production endpoint:

```text
https://www.energoeffekt-rostov.ru/api/leads/
```

В корне frontend должен находиться `.env`.

Production-пример:

```env
VITE_API_BASE_URL=https://www.energoeffekt-rostov.ru
```

После изменения `.env` frontend необходимо пересобрать:

```bash
npm run build
```

---

## Переменные окружения для local/dev

Локальный `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

В репозитории должен находиться `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Файл `.env` не должен попадать в Git.

---

## Локальный запуск frontend

```bash
cd ee_site/frontend
npm install
npm run dev
```

Адрес:

```text
http://localhost:5173/
```

---

## Локальный запуск backend

```powershell
cd ee_site/backend
.\.venv\Scripts\activate
python manage.py runserver
```

API:

```text
http://127.0.0.1:8000/api/leads/
```

---

## Production-сборка frontend

Путь на production-сервере:

```text
/var/www/ee_site/repo/ee_site/frontend
```

Сборка:

```bash
cd /var/www/ee_site/repo/ee_site/frontend
npm install
npm run build
```

Результат:

```text
dist/
```

Nginx раздаёт frontend из:

```text
/var/www/ee_site/repo/ee_site/frontend/dist
```

Типичный deploy frontend:

```bash
cd /var/www/ee_site/repo
git pull --ff-only origin main

cd /var/www/ee_site/repo/ee_site/frontend
npm run build

sudo systemctl reload nginx
```

Если backend не менялся, Gunicorn перезапускать не требуется.

---

## Production backend и security

Рекомендуемые production-настройки:

```env
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=energoeffekt-rostov.ru,www.energoeffekt-rostov.ru
CSRF_TRUSTED_ORIGINS=https://energoeffekt-rostov.ru,https://www.energoeffekt-rostov.ru
```

Из production `.env` не должны попадать в Git:

- `SECRET_KEY`;
- SMTP-пароли;
- пароли базы данных;
- приватные ключи;
- deploy key private part;
- другие секреты.

---

## Favicon и app icons

Файлы находятся в:

```text
public/
```

Комплект:

```text
favicon.ico
favicon.svg
favicon-48x48.png
favicon-120x120.png
apple-touch-icon.png
android-chrome-192x192.png
android-chrome-512x512.png
site.webmanifest
```

Подключение в `index.html`:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" type="image/png" sizes="120x120" href="/favicon-120x120.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#f97316" />
```

На production для `.webmanifest` добавлен MIME-тип:

```text
application/manifest+json webmanifest;
```

Эта настройка находится на сервере в `/etc/nginx/mime.types` и не входит в Git-репозиторий.

---

## SEO foundation

Используются:

```text
index.html
public/robots.txt
public/sitemap.xml
public/og-image.jpg
public/yandex_cd192b2d43f6e674.html
public/google6a7aad73ef6a2606.html
```

В `index.html` настроены:

- title;
- description;
- canonical;
- OpenGraph;
- Twitter metadata;
- Organization JSON-LD.

Canonical-домен:

```text
https://www.energoeffekt-rostov.ru
```

`robots.txt`:

```text
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://www.energoeffekt-rostov.ru/sitemap.xml
```

После появления индексируемых прямых страниц кейсов необходимо проверить и при необходимости обновить `sitemap.xml`.

---

## SEO-компонент

Компонент:

```text
src/components/Seo/
```

Отвечает за динамические meta-данные внутренних страниц.

При добавлении новой индексируемой страницы необходимо проверить:

- title;
- description;
- canonical;
- OpenGraph;
- JSON-LD, если требуется;
- наличие URL в sitemap.

---

## Яндекс Вебмастер

Файл подтверждения:

```text
public/yandex_cd192b2d43f6e674.html
```

Файл нельзя удалять после подтверждения прав.

---

## Google Search Console

Файл подтверждения:

```text
public/google6a7aad73ef6a2606.html
```

Файл нельзя удалять после подтверждения прав.

---

## PageSpeed / Lighthouse

Зафиксированные результаты этапа ЭЭ-5:

```text
Home / Mobile
Performance      92
Accessibility    90
Best Practices   100
SEO              100

Home / Desktop
Performance      99
Accessibility    93
Best Practices   100
SEO              100

/solutions/bmk / Mobile
Performance      88
Accessibility    90
Best Practices   100
SEO              100

/solutions/bmk / Desktop
Performance      100
Accessibility    93
Best Practices   100
SEO              100
```

После подключения галерей и дополнительных изображений кейсов рекомендуется повторить проверку:

- главной;
- `/cases`;
- нескольких `/cases/:slug`;
- mobile LCP;
- CLS;
- размер и формат изображений.

---

## PrivacyPage

Компонент:

```text
src/pages/PrivacyPage/PrivacyPage.jsx
```

Маршрут:

```text
/privacy
```

Реализовано:

- визуальная структура в стиле сайта;
- SectionHeader;
- поясняющий notice-блок;
- карточка с разделами политики;
- реквизиты оператора;
- раздел cookies;
- desktop/mobile стили.

Основные разделы:

- оператор персональных данных;
- собираемые данные;
- технические данные;
- файлы и вложения;
- цели обработки;
- правовое основание;
- cookies и аналитика;
- хранение и защита;
- передача третьим лицам;
- трансграничная передача;
- согласие пользователя;
- отзыв согласия;
- контакты.

Реквизиты оператора:

```text
ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ЭНЕРГОЭФФЕКТ»
ИНН: 6161070112
ОГРН: 1146193000480
Юридический адрес:
344113, Россия, Ростовская область,
г. Ростов-на-Дону,
б-р Комарова, зд. 28/2, ком. 19

Email: sales@ee-don.ru
Телефон: +7 800 444-07-66
```

---

## CookieBanner

Компонент:

```text
src/components/CookieBanner/CookieBanner.jsx
```

Реализовано:

- появляется при первом заходе;
- кнопка «Хорошо» скрывает баннер;
- согласие сохраняется в `localStorage`;
- после обновления баннер повторно не появляется;
- ссылка «Подробнее» ведёт на `/privacy#cookies`.

Ключ:

```text
ee_cookie_consent
```

Текущая реализация является MVP-уведомлением и не содержит управления отдельными категориями cookies.

---

## Типографика

В проекте используются variable-шрифты:

```text
Onest Variable
Golos Text Variable
```

Подключение выполняется через Fontsource Variable.

В `main.jsx` подключены:

```jsx
import "@fontsource-variable/onest/wght.css";
import "@fontsource-variable/golos-text/wght.css";
```

В `src/styles/global.css` определены переменные:

```css
:root {
  --font-body:
    "Golos Text Variable",
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --font-heading:
    "Onest Variable",
    "Golos Text Variable",
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
```

Основной текст использует:

```css
body {
  font-family: var(--font-body);
}
```

Заголовки используют:

```css
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-heading);
}
```

Типографическая система согласована для:

- Header;
- Hero;
- заголовков секций;
- продуктовых и сервисных H1;
- EntitySwitcher;
- ProductDetailsAccordion;
- FAQ;
- кнопок;
- карточек;
- AI Summary;
- формы заявки;
- контактных карточек;
- Footer;
- CaseModal;
- прямых страниц кейсов.

---

## Консолидация CSS-типографики

Для безопасной настройки сначала использовался временный слой:

```text
TYPOGRAPHY OVERRIDES
```

После визуального согласования все утверждённые параметры были перенесены в исходные блоки компонентов.

Выполнено:

- перенесены значения шрифтов;
- перенесены размеры;
- перенесена насыщенность;
- перенесены line-height и letter-spacing;
- очищены конфликтующие desktop/mobile правила;
- сохранены отдельные ступени адаптива;
- устранены дубли EntitySwitcher;
- сохранена специфичность CTA в карточках;
- сохранена чёрная рамка кнопки формы;
- сохранены responsive-параметры кейсов;
- удалён временный контрольный слой.

Поиск:

```text
TYPOGRAPHY OVERRIDES
```

должен возвращать:

```text
0 совпадений
```

Важно: новые типографические изменения нужно вносить в исходные блоки соответствующих компонентов. Не следует снова создавать общий слой переопределений в конце `App.css`, если задачу можно решить в основном правиле компонента.

---

## Стили

Базовые стили вынесены в:

```text
src/styles/
  variables.css
  global.css
  layout.css
```

Назначение:

### `variables.css`

- цвета;
- размеры;
- переменные дизайн-системы.

### `global.css`

- `html`;
- `body`;
- ссылки;
- формы;
- глобальные шрифты;
- `scroll-behavior`;
- `scroll-padding-top`.

### `layout.css`

- `.site`;
- `.container`;
- `.section`;
- базовый `.section__head`.

### `App.css`

Содержит стили:

- Header;
- Hero;
- AI Summary;
- карточек;
- продуктов и услуг;
- CaseModal;
- CasePage;
- формы;
- FAQ;
- CookieBanner;
- PrivacyPage;
- Footer;
- EntitySwitcher;
- responsive-правил.

В `App.css` объявлена:

```css
:root {
  --container-padding: 24px;
}
```

Переменная используется в mobile-поведении EntitySwitcher.

CSS пока остаётся частично монолитным. Разделение по компонентам возможно на отдельном этапе после стабилизации функциональности.

---

## Responsive-архитектура

Основные контрольные диапазоны:

```text
desktop                 > 960px
tablet / compact        ≤ 960px
small mobile            ≤ 640px
```

Дополнительные локальные media queries используются для отдельных компонентов, включая CaseModal и сетки карточек.

Последняя типографическая консолидация проверена на:

- desktop;
- 768 px;
- 390 px.

Также в проекте ранее проверялись:

```text
360 px
390 px
430 px
768 px
960 px
```

При изменениях нельзя улучшать desktop ценой изменения уже работающей mobile-версии.

---

## Scroll-сценарии

Компонент:

```text
src/components/ScrollToTop/ScrollToTop.jsx
```

Реализовано:

- плавная якорная навигация;
- учёт sticky Header;
- открытие обычных страниц сверху;
- обработка `/privacy#cookies`;
- переходы с карточек продуктов и услуг;
- контекстное поведение логотипа;
- временное отключение глобального smooth-scroll при ручных JS-анимациях;
- восстановление smooth-scroll после завершения сценария.

Основные значения `location.state`:

```text
lead-card-then-top
products-then-top
services-then-top
top-smooth
```

Глобальное правило в `global.css` сохранено:

```css
html {
  scroll-behavior: smooth;
}
```

---

## Header

Header:

- sticky;
- адаптирован под desktop и mobile;
- логотип кликабельный;
- навигация строится из `navigation.js`;
- активный пункт подсвечивается;
- mobile-навигация поддерживает горизонтальное размещение.

Поведение логотипа:

- на главной — smooth-scroll наверх;
- на продуктовой странице — переход на главную через секцию продуктов и подъём наверх;
- на сервисной странице — переход через секцию услуг и подъём наверх;
- на других внутренних страницах — переход на главную вверх.

---

## Footer

Footer содержит:

- краткое позиционирование;
- юридический минимум;
- навигацию;
- блок экосистемы;
- контакты.

Юридический минимум:

```text
© ООО «Энергоэффект»
ИНН: 6161070112
```

Контакты:

```text
+7 800 444-07-66
sales@ee-don.ru
```

Экосистема:

- Энергоэффект — производственные решения;
- ТД Энергоэффект — комплектация инженерных объектов;
- Теплоучет — оборудование и комплектующие.

Внешние адреса:

```text
https://td-energoeffect.ru/
https://teplouchet.com/
```

Ссылка «Энергоэффект — производственные решения» должна выполнять полноценный React Router-переход на главную.

---

## Проверочные сценарии

После frontend-изменений проверять:

```text
/
/about
/solutions
/solutions/bmk
/solutions/btp
/solutions/vns
/solutions/pns
/solutions/automation-cabinets
/services
/services/design
/services/construction-installation
/services/commissioning
/cases
/cases/:slug
/contacts
/privacy
/privacy#cookies
/test-error-page
```

Дополнительно:

- форма на главной;
- форма на продуктовой странице;
- форма на сервисной странице;
- отправка с файлом;
- email с вложением;
- предупреждение под полем файла;
- Django Admin;
- sticky Header;
- Footer;
- CookieBanner;
- якорная навигация;
- `/contacts → /#contacts`;
- карточки кейсов;
- модальное окно кейса;
- прямой маршрут кейса;
- закрытие через крестик;
- закрытие через фон;
- закрытие через `Esc`;
- стрелки галереи;
- mobile-свайп;
- возврат к исходной позиции списка;
- CTA из кейса к контактам;
- отсутствие горизонтального overflow.

---

## Проверка EntitySwitcher

### Продукты

```text
/solutions/bmk
/solutions/btp
/solutions/vns
/solutions/pns
/solutions/automation-cabinets
```

Ожидается:

- отображаются только продукты;
- активный продукт подсвечен;
- переходы работают;
- Header подсвечивает «Продукция»;
- mobile-лента не ломает vertical scroll;
- переключатель не уезжает без необходимости.

### Услуги

```text
/services/design
/services/construction-installation
/services/commissioning
```

Ожидается:

- отображаются только услуги;
- активная услуга подсвечена;
- переходы работают;
- Header подсвечивает «Услуги»;
- СМР и ПНР корректно видны на mobile;
- нет размытия или обрезания пунктов.

---

## Проверка кейсов

### Главная

- открыть избранный кейс;
- проверить изменение URL;
- переключить изображения;
- закрыть модальное окно;
- убедиться, что страница остаётся в секции кейсов;
- проверить CTA.

### `/cases`

- открыть карточку из списка;
- закрыть окно;
- проверить восстановление позиции;
- проверить несколько кейсов;
- проверить mobile.

### Прямой маршрут

- открыть `/cases/:slug` в новой вкладке;
- обновить страницу;
- проверить отсутствие 404;
- проверить галерею;
- проверить вертикальный scroll;
- проверить отсутствие горизонтального сдвига;
- проверить CTA и возврат к кейсам.

---

## Production SPA fallback

Nginx должен отдавать `index.html` для React Router-маршрутов:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Без SPA fallback прямые заходы на `/solutions/*`, `/services/*` и `/cases/:slug` могут вернуть серверный 404 до загрузки React.

---

## Что намеренно не используется

На текущем этапе не добавлены:

- Redux;
- TypeScript migration;
- CMS;
- i18n;
- авторизация;
- личный кабинет;
- калькуляторы;
- тяжёлые UI-библиотеки;
- CRM-интеграция;
- расширенное управление категориями cookies;
- фильтры реестра кейсов;
- полноценная аналитика пользовательских событий;
- банковские реквизиты в Footer;
- page transition animation между продуктовыми и сервисными страницами.

Это соответствует текущему MVP/production-ready подходу.

---

## ЭЭ-5 — выполнено

В рамках ЭЭ-5 завершено:

- production smoke-test;
- canonical под `www`;
- `robots.txt`;
- `sitemap.xml`;
- OpenGraph;
- Organization JSON-LD;
- Яндекс Вебмастер;
- Google Search Console;
- форма заявки;
- загрузка файлов;
- email-уведомления;
- Django Admin;
- production security cleanup;
- Lighthouse;
- mobile-проверки;
- контактные данные;
- production-сервис.

---

## ЭЭ-5.2 — выполнено

В рамках ЭЭ-5.2 завершено:

- универсальный EntitySwitcher;
- переключатель продуктов;
- переключатель услуг;
- разделение продуктов и услуг;
- `switcherTitle`;
- основа `theme`;
- active state Header;
- route-based и section-based навигация;
- mobile-лента;
- сохранение vertical scroll;
- отказ от рискованной page transition animation;
- успешная production-сборка.

---

## Последние выполненные frontend-улучшения

Выполнено после ЭЭ-5.2:

- сокращена главная страница;
- удалены лишние блоки;
- переработаны карточки продукции;
- переработаны карточки услуг;
- добавлены реальные изображения;
- создан единый `cases.js`;
- добавлен `CaseCard`;
- реализован реестр `/cases`;
- реализован `CaseModal`;
- добавлен маршрут `/cases/:slug`;
- реализован прямой просмотр кейса;
- добавлены галереи;
- добавлен mobile-свайп;
- стабилизировано закрытие модального окна;
- стабилизировано восстановление scroll-позиции;
- исправлен horizontal overflow прямой страницы кейса;
- адаптирована типографика кейса;
- подключены Onest Variable и Golos Text Variable;
- согласована типографика сайта;
- значения перенесены в исходные компонентные блоки;
- удалён временный `TYPOGRAPHY OVERRIDES`;
- устранены дубли и конфликты CSS;
- проверены desktop, 768 px и 390 px;
- `npm run build` проходит успешно.

---

## Следующие этапы

Рекомендуется вынести в следующие задачи:

1. Завершить и проверить контент всех кейсов.
2. Проверить alt-тексты и подписи всех галерей.
3. Оптимизировать изображения кейсов.
4. Обновить и проверить `sitemap.xml` с маршрутами `/cases/:slug`.
5. Выполнить production-deploy последних frontend-изменений.
6. Провести production smoke-test модальных и прямых кейсов.
7. Повторить Lighthouse для главной, `/cases` и прямых кейсов.
8. Продолжить работу с Core Web Vitals.
9. Постепенно разделить `App.css` по компонентам.
10. Подключить аналитику после согласования cookies.
11. Передать юридический текст на финальную проверку юристу.
12. Расширять продуктовый и сервисный контент.
13. Подготовить будущие CRM-интеграции.
14. Отдельно рассмотреть page transition animation без риска для scroll-сценариев.

---

## Важное production-замечание

Файл `.env` не должен попадать в GitHub.

Нельзя распространять:

- production-пароли;
- SMTP-пароли;
- `SECRET_KEY`;
- доступы к базе данных;
- приватные ключи;
- deploy key private part.

В GitHub допустимо хранить только `.env.example` без секретов.