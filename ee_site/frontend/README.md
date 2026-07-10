# Frontend сайта ООО «Энергоэффект»

Frontend-часть production-сайта ООО «Энергоэффект».

Проект развивается как инженерная B2B-платформа: производственные решения, продуктовые направления, услуги, заявки, SEO-структура, AEO/GEO-ready подход, реальные кейсы и задел под дальнейшее развитие экосистемы.

---

## Production-статус

Сайт размещён в production.

Основной рабочий адрес:

```text
https://www.energoeffekt-rostov.ru

Домен без www перенаправляет на основной адрес:

https://energoeffekt-rostov.ru → https://www.energoeffekt-rostov.ru

В production проверено:

frontend открывается;
HTTPS работает;
домен с www открывается;
домен без www перенаправляет на основной адрес;
внутренние React-маршруты открываются;
прямые заходы на внутренние маршруты работают;
SPA fallback работает через nginx;
/contacts перенаправляет пользователя к контактному блоку главной страницы;
форма заявки отправляется;
заявка сохраняется в backend / базе данных;
файл заявки загружается и сохраняется;
заявка отображается в Django Admin;
email-уведомление менеджеру отправляется;
email с вложением приходит;
cookie-баннер работает;
страница политики обработки персональных данных доступна;
robots.txt доступен;
sitemap.xml доступен;
Яндекс Вебмастер подключён;
Google Search Console подключён.

Production-проверки ЭЭ-5:

/                                   ок
/about                              ок
/solutions                          ок
/solutions/bmk                      ок
/solutions/btp                      ок
/solutions/vns                      ок
/solutions/pns                      ок
/solutions/automation-cabinets      ок
/services                           ок
/services/design                    ок
/services/construction-installation ок
/services/commissioning             ок
/cases                              ок
/contacts                           ок, redirect на /#contacts
/privacy                            ок

Прямые заходы проверены:

/solutions/bmk                      ок
/services/design                    ок
/privacy                            ок

Admin-проверка:

Django Admin открывается
заявки отображаются
заявка без файла сохраняется
заявка с файлом сохраняется
source_page сохраняется
source_system сохраняется

Email-проверка:

письмо без файла приходит
письмо с файлом приходит
вложение в письме есть
служебная фраза про Django Admin из письма удалена

Контактные данные production:

Телефон: +7 800 444-07-66
tel-ссылка: tel:+78004440766
Email: sales@ee-don.ru

Состояние сервера после ЭЭ-5:

git status — рабочая ветка main актуальна
ee_site_gunicorn.service — active (running)

Важно: .env, резервные копии .env и другие файлы с секретами не добавляются в Git и не коммитятся.

Технологии
React
Vite
React Router
CSS Modules не используются
Основные стили хранятся в обычных CSS-файлах
Backend API: Django + DRF
Production-раздача frontend: nginx
Production backend: Django + Gunicorn + PostgreSQL
Назначение проекта

Frontend должен решать не только задачу «показать сайт», но и задачу B2B-продаж:

показать ООО «Энергоэффект» как инженерную производственную платформу;
разделить продукты и услуги;
показать реальные реализованные объекты;
дать пользователю понятный путь к заявке;
подготовить структуру под SEO / GEO / AEO;
создать масштабируемую основу для будущего инженерного портала;
обеспечить юридически корректную базу: политика персональных данных, согласие в форме, cookies, реквизиты компании.
Продуктовые направления

Порядок продуктов фиксированный:

Блочно-модульные котельные
Блочные тепловые пункты
Водопроводные насосные станции
Пожарные насосные станции
Шкафы управления и автоматизации

Важно: в рамках проекта ЭЭ аббревиатура ПНС означает пожарные насосные станции.

Услуги

Услуги отделены от продуктов:

Проектирование
Строительно-монтажные работы
Пусконаладка и ввод в эксплуатацию

Это важно для:

SEO;
UX;
CRM-логики;
будущих фильтров;
AI-ready структуры.
Кейсы

В проект добавлена начальная архитектура кейсов.

Текущая логика:

на главной показываются только избранные кейсы;
на странице /cases показывается общий список доступных кейсов;
реальные фото объектов подключены как cover-изображения;
подробные страницы отдельных кейсов пока не подключены;
переходы на /cases/:slug будут добавляться следующим этапом после подготовки описаний и структуры детальных страниц.

Текущие реальные объекты:

БМК — ФОК Элиста
БТП — молочное производство
БТП — объект в Анапе
БТП — объект в Дербенте
БТП — производственный объект

Изображения кейсов находятся в:

src/assets/cases/

Рекомендуемая структура папок:

src/assets/cases/
  bmk-fok-elista/
    cover.jpg
    01.jpg
    02.jpg
    ...

  btp-alatyr-dairy-plant/
    cover.jpg
    01.jpg
    02.jpg

  btp-anapa-luchi/
    cover.webp
    01.webp
    02.webp

  btp-derbent-magma/
    cover.webp
    01.webp
    02.webp

  btp-kamensky-plant/
    cover.webp
    01.webp
    02.webp

На текущем этапе в общий список кейсов подключаются только cover-изображения. Галереи отдельных объектов будут подключаться на будущих детальных страницах кейсов.

Структура проекта
src/
  api/
    leadsApi.js

  assets/
    cases/
      bmk-fok-elista/
      btp-alatyr-dairy-plant/
      btp-anapa-luchi/
      btp-derbent-magma/
      btp-kamensky-plant/

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
Data-файлы
src/data/products.js

Единый источник данных для продуктов.

Используется в:

карточках продуктов на главной;
страницах продуктов;
переключателе продуктовых направлений;
форме заявки;
SEO-структуре;
FAQ / AEO-ready структуре.

Каждый продукт может содержать:

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

Поле switcherTitle используется для компактного отображения продукта в переключателе.

Пример:

Блочно-модульные котельные → БМК
Блочные тепловые пункты → БТП
Водопроводные насосные станции → ВНС
Пожарные насосные станции → ПНС
Шкафы управления и автоматизации → ШУиА

Поля cardTitle и cardDescription используются для коротких карточек на главной. Это позволяет держать главную компактной, а подробные инженерные формулировки оставлять на внутренних страницах.

Поле theme заложено как foundation для будущей визуальной индивидуализации продуктовых страниц.

На текущем этапе продукты используют единую фирменную тему сайта.

src/data/services.js

Единый источник данных для услуг.

Используется в:

карточках услуг на главной;
страницах услуг;
переключателе услуг;
форме заявки;
SEO-структуре;
FAQ / AEO-ready структуре.

Каждая услуга может содержать:

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

Поле switcherTitle используется для компактного отображения услуги в переключателе.

Пример:

Проектирование → Проектирование
Строительно-монтажные работы → СМР
Пусконаладка и ввод в эксплуатацию → ПНР

Поля cardTitle и cardDescription используются для коротких карточек услуг на главной.

Поле theme заложено как foundation для будущей визуальной индивидуализации сервисных страниц.

На текущем этапе услуги используют единую фирменную тему сайта.

src/data/cases.js

Единый источник данных для кейсов.

Используется в:

коротком блоке кейсов на главной;
странице /cases;
будущем маршруте /cases/:slug.

Каждый кейс содержит:

slug
type
title
description
previewDescription
category
coverImage
coverImageAlt
url
isFeatured

Текущая логика:

cases           → все кейсы для страницы /cases
featuredCases   → избранные кейсы для главной

На текущем этапе детальные страницы кейсов не подключены, поэтому карточки кейсов не ведут внутрь отдельных объектов.

src/data/navigation.js

Единый источник данных для навигации.

Текущая логика:

верхнее меню ведёт по ключевым секциям главной landing-страницы и на страницу кейсов;
отдельные страницы продуктов и услуг остаются доступными через карточки, footer и прямые URL;
главная страница работает как компактная B2B-презентация;
активный пункт навигации подсвечивается на desktop и mobile;
на внутренних страницах /solutions/* активен пункт «Продукция»;
на внутренних страницах /services/* активен пункт «Услуги»;
на странице /cases активен пункт «Кейсы»;
на главной странице активный пункт определяется по текущей секции.

Текущие пункты основной навигации:

Продукция → /#products
Услуги    → /#services
Кейсы     → /#cases
Контакты  → /#contacts
Основные маршруты

Используется react-router-dom.

/                                   Главная
/about                              О компании
/solutions                          Продуктовые направления
/solutions/bmk                      Блочно-модульные котельные
/solutions/btp                      Блочные тепловые пункты
/solutions/vns                      Водопроводные насосные станции
/solutions/pns                      Пожарные насосные станции
/solutions/automation-cabinets      Шкафы управления и автоматизации
/services                           Услуги
/services/design                    Проектирование
/services/construction-installation СМР
/services/commissioning             Пусконаладка
/cases                              Кейсы
/contacts                           Redirect на /#contacts
/privacy                            Политика обработки персональных данных
/privacy#cookies                    Раздел cookies на странице политики
*                                   404

Маршрут /contacts не используется как отдельная пользовательская страница. Он перенаправляет пользователя на контактный блок главной страницы:

/contacts → /#contacts

Это сделано для того, чтобы не дробить основной сценарий обращения и вести пользователя сразу к форме заявки и контактной информации.

Главная страница

Главная страница построена как компактная landing-страница:

Hero
AI Summary
Продуктовые направления
Услуги
Кейсы
Контакты / заявка
Footer

Главная — основной пользовательский сценарий.

Отдельные страницы нужны для:

SEO;
AEO/GEO;
будущего расширения;
структуры инженерного портала;
продуктовых и сервисных посадочных страниц;
страницы кейсов и будущих детальных страниц объектов.

На главной странице используются якорные секции:

#products   Продуктовые направления
#services   Услуги
#cases      Кейсы
#contacts   Контакты и заявка

Для активного пункта навигации используются секции, отражённые в верхнем меню:

#products   → Продукция
#services   → Услуги
#cases      → Кейсы
#contacts   → Контакты

Блоки Инженерная экспертиза и Производственный процесс удалены с главной, чтобы сократить страницу и усилить фокус на продуктах, услугах, реальных объектах и заявке.

Карточки на главной
ProductCard

Компонент:

src/components/ProductCard/

Карточки продукции на главной работают как витрина направлений.

Особенности:

вся карточка кликабельна;
используется реальное изображение направления;
для БМК / БТП / ВНС отображается логотип линейки, если он задан;
для направлений без линейки используется спокойный технический маркер;
используются короткие поля cardTitle и cardDescription;
CTA выполнен как текстовая ссылка Подробнее со стрелкой через CSS;
переход ведёт на соответствующую страницу продукта.
ServiceCard

Компонент:

src/components/ServiceCard/

Карточки услуг на главной отличаются от продуктовых карточек и показывают инженерные работы.

Особенности:

вся карточка кликабельна;
используется изображение услуги;
убраны лишние маркеры Проектирование / СМР / ПНР, чтобы не дублировать полное название;
используются короткие поля cardTitle и cardDescription;
CTA выполнен как текстовая ссылка Подробнее со стрелкой через CSS;
переход ведёт на соответствующую страницу услуги.
CaseCard

Компонент:

src/components/CaseCard/

Карточка кейса используется:

на главной;
на странице /cases.

Особенности:

показывает cover-фото объекта;
выводит тип объекта: БМК / БТП;
выводит заголовок кейса;
выводит короткое описание;
пока не ведёт на детальную страницу объекта, так как /cases/:slug будет добавлен следующим этапом.
Страница /cases

Страница:

src/pages/CasesPage/

Маршрут:

/cases

Назначение:

показать все доступные кейсы;
дать пользователю подтверждение реального опыта;
не перегружать главную большим количеством объектов;
подготовить основу под будущие детальные страницы отдельных кейсов.

Текущая структура страницы:

SectionHeader
Список всех кейсов из src/data/cases.js
CTA Обсудить похожую задачу

На текущем этапе страница /cases является рабочим реестром кейсов, но без переходов внутрь отдельных объектов.

Будущий этап:

/cases/bmk-fok-elista
/cases/btp-alatyr-dairy-plant
/cases/btp-anapa-luchi
/cases/btp-derbent-magma
/cases/btp-kamensky-plant

На будущих детальных страницах планируется:

Hero кейса;
AI Summary;
что было выполнено;
особенности решения;
галерея фото;
связанные продукты и услуги;
CTA Обсудить похожую задачу.
Контактный блок главной страницы

Блок #contacts является основной точкой обращения пользователя.

В нём есть:

заголовок “Обсудить задачу”;
карточка “Что можно отправить”;
карточка “Как с нами связаться”;
карточка “Реквизиты компании”;
форма заявки.

Карточки расположены в логике:

Что можно отправить
Как с нами связаться
Реквизиты компании

Контактные данные:

Телефон: +7 800 444-07-66
Email: sales@ee-don.ru

Телефон отображается в читаемом формате, а tel-ссылка сохраняется в техническом формате:

tel:+78004440766

Карточка реквизитов содержит краткий вариант:

ООО «ЭНЕРГОЭФФЕКТ»
ИНН: 6161070112
ОГРН: 1146193000480
Юр. адрес: Ростов-на-Дону, б-р Комарова, зд. 28/2, ком. 19

Полные реквизиты оператора персональных данных находятся на странице /privacy.

Product / Service Switcher

В рамках ЭЭ-5.2 добавлен универсальный переключатель между сущностями.

Компонент:

src/components/EntitySwitcher/EntitySwitcher.jsx
src/components/EntitySwitcher/index.js

Компонент используется:

на продуктовых страницах;
на страницах услуг.
Переключатель продуктов

На страницах /solutions/* отображается продуктовый переключатель:

БМК / БТП / ВНС / ПНС / ШУиА

Он ведёт только между продуктовыми страницами:

/solutions/bmk
/solutions/btp
/solutions/vns
/solutions/pns
/solutions/automation-cabinets

На продуктовых страницах активный продукт подсвечивается в переключателе.

Одновременно в Header активен пункт навигации:

Продукция
Переключатель услуг

На страницах /services/* отображается переключатель услуг:

Проектирование / СМР / ПНР

Он ведёт только между страницами услуг:

/services/design
/services/construction-installation
/services/commissioning

На страницах услуг активная услуга подсвечивается в переключателе.

Одновременно в Header активен пункт навигации:

Услуги
Mobile-поведение переключателя

На mobile переключатель работает как горизонтальная лента:

элементы не переносятся на вторую строку;
активный элемент остаётся видимым;
для услуг реализовано аккуратное позиционирование активной кнопки;
для продуктов убрано лишнее центрирование, чтобы переключатель не сдвигался без необходимости;
blur/fade/chevron-подсказки не используются;
вертикальный scroll не ломается.
Что намеренно не добавлено

Анимация смены страницы через opacity + translateX была протестирована, но отложена.

Причина: при добавлении page transition animation появился риск затронуть существующие scroll-сценарии. Текущая версия переключателя работает стабильно, поэтому анимация смены страниц вынесена на будущий отдельный этап.

Форма заявки

Компонент:

src/components/LeadForm/LeadForm.jsx

API helper:

src/api/leadsApi.js

Форма отправляет данные в backend:

POST /api/leads/

Передаются:

имя;
компания;
телефон;
email;
интересующее направление;
описание задачи;
файл;
source_page;
source_system.

Особенности:

продукты и услуги подтягиваются из data-файлов;
на странице продукта/услуги направление подставляется автоматически;
выбранное направление добавляется в описание заявки;
success/error состояния реализованы;
success-сообщение плавно исчезает;
файл заявки передаётся в backend;
заявка сохраняется в базе данных;
заявка отображается в Django Admin;
после сохранения заявки отправляется email-уведомление менеджеру;
вложение, если оно было прикреплено, приходит в письме;
служебная фраза про Django Admin из письма удалена;
есть согласие на обработку персональных данных;
ссылка на политику из формы открывается в новой вкладке, чтобы пользователь не потерял заполненную заявку;
для ссылки используется rel="noopener noreferrer";
под полем файла добавлено предупреждение о персональных данных третьих лиц.

Предупреждение под загрузкой файла:

Не прикрепляйте документы, содержащие персональные данные третьих лиц,
если у вас нет права на их передачу.

На страницах продукта и услуги секция заявки имеет якорь:

<section id="lead-form" className="section section--contact">

Это нужно для scroll-сценариев перехода с карточек продукта/услуги.

Production API

В production frontend использует backend API по адресу:

https://www.energoeffekt-rostov.ru/api/leads/

В корне frontend должен быть файл:

.env

Production-пример:

VITE_API_BASE_URL=https://www.energoeffekt-rostov.ru

Важно: после изменения .env frontend нужно пересобрать:

npm run build
Переменные окружения для local/dev

Для локальной разработки используется .env в корне frontend.

Пример для локальной разработки:

VITE_API_BASE_URL=http://127.0.0.1:8000

Также должен быть файл:

.env.example

Пример .env.example:

VITE_API_BASE_URL=http://127.0.0.1:8000

Файл .env не должен попадать в GitHub.

Запуск frontend локально

Перейти в папку frontend:

cd ee_site/frontend

Установить зависимости:

npm install

Запустить dev-сервер:

npm run dev

Открыть:

http://localhost:5173/
Backend для работы формы локально

Для проверки отправки заявки backend должен быть запущен отдельно:

cd ee_site/backend
.\.venv\Scripts\activate
python manage.py runserver

Backend API должен быть доступен по адресу:

http://127.0.0.1:8000/api/leads/
Production-сборка frontend

На production-сервере frontend расположен по пути:

/var/www/ee_site/repo/ee_site/frontend

Установка зависимостей:

npm install

Сборка:

npm run build

Production-сборка создаётся в:

dist/

Nginx раздаёт frontend из:

/var/www/ee_site/repo/ee_site/frontend/dist

После frontend-изменений на сервере обычно достаточно выполнить:

cd /var/www/ee_site/repo
git pull --ff-only origin main

cd /var/www/ee_site/repo/ee_site/frontend
npm run build

sudo systemctl reload nginx

Если backend не менялся, Gunicorn перезапускать не требуется.

Production backend / security cleanup

Production backend работает через Gunicorn:

ee_site_gunicorn.service

После ЭЭ-5 проверено:

ee_site_gunicorn.service — active (running)

Production .env очищен от временных dev/IP-значений.

Проверенные production-настройки:

DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=energoeffekt-rostov.ru,www.energoeffekt-rostov.ru
CSRF_TRUSTED_ORIGINS=https://energoeffekt-rostov.ru,https://www.energoeffekt-rostov.ru

Из production-настроек удалены:

localhost
127.0.0.1
временные IP-адреса

Важно: .env и резервные копии .env не должны попадать в GitHub.

Favicon / App icons

В рамках production-настройки favicon подготовлен полный комплект иконок для браузеров, поисковой выдачи, iOS/Android и web app manifest.

Файлы находятся в:

public/

Используемые файлы:

favicon.ico
favicon.svg
favicon-48x48.png
favicon-120x120.png
apple-touch-icon.png
android-chrome-192x192.png
android-chrome-512x512.png
site.webmanifest

Назначение:

favicon.ico — fallback для браузеров, поисковиков и внешних сервисов;
favicon.svg — современный favicon для браузеров;
favicon-48x48.png — PNG-вариант для поисковиков и сервисов;
favicon-120x120.png — PNG-вариант, удобный для Яндекса и внешних сервисов;
apple-touch-icon.png — иконка для iOS;
android-chrome-192x192.png — иконка для Android / Chrome;
android-chrome-512x512.png — крупная иконка для Android / Chrome и manifest;
site.webmanifest — manifest-файл с базовыми app icon metadata.

В index.html подключены:

<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" type="image/png" sizes="120x120" href="/favicon-120x120.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#f97316" />

Production-проверка:

/favicon.ico                  200 OK, image/x-icon
/favicon.svg                  200 OK
/favicon-48x48.png            200 OK
/favicon-120x120.png          200 OK
/apple-touch-icon.png         200 OK
/android-chrome-192x192.png   200 OK
/android-chrome-512x512.png   200 OK, image/png
/site.webmanifest             200 OK, application/manifest+json

На production-сервере дополнительно добавлен MIME-тип для .webmanifest в nginx:

/etc/nginx/mime.types

Добавленная строка:

application/manifest+json             webmanifest;

Важно: изменение /etc/nginx/mime.types является серверной production-настройкой и не входит в Git-репозиторий проекта.

SEO foundation

Добавлены и проверены базовые SEO-файлы и настройки:

index.html
public/robots.txt
public/sitemap.xml
public/og-image.jpg
public/yandex_cd192b2d43f6e674.html
public/google6a7aad73ef6a2606.html

В index.html настроены:

title;
description;
canonical;
OpenGraph;
summary meta;
Organization JSON-LD.

Проверка локально:

http://localhost:5173/robots.txt
http://localhost:5173/sitemap.xml

Проверка production:

https://www.energoeffekt-rostov.ru/robots.txt
https://www.energoeffekt-rostov.ru/sitemap.xml
https://www.energoeffekt-rostov.ru/og-image.jpg

Canonical-домен:

https://www.energoeffekt-rostov.ru

Проверено:

robots.txt использует актуальный sitemap
sitemap.xml использует актуальный www-домен
canonical использует актуальный www-домен
og:url использует актуальный www-домен
og:image использует актуальный www-домен
Organization JSON-LD найден
Organization JSON-LD содержит name, url, telephone, email

robots.txt:

User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://www.energoeffekt-rostov.ru/sitemap.xml

sitemap.xml содержит 14 индексируемых URL.

Важно: после добавления будущих детальных страниц кейсов /cases/:slug нужно будет обновить sitemap.xml.

SEO / AEO / GEO структура

В проекте используется компонент:

src/components/Seo/

Он отвечает за динамические meta-данные страниц.

Также используется компонент:

src/components/AiSummary/

Он применяется:

на главной странице;
на продуктовых страницах;
на страницах услуг.

Задача блока:

дать краткое содержание страницы пользователю;
улучшить машинопонятность страницы;
подготовить сайт к GEO / AEO / AI-ready подходу.
FAQ и JSON-LD

На продуктовых и сервисных страницах добавлены FAQ-блоки.

FAQ используется не только как визуальный блок, но и как SEO/AEO/GEO-структура.

Компонент:

src/components/FAQ/

Важно: на страницах с FAQ должен выводиться JSON-LD:

<script type="application/ld+json">

Содержимое должно включать:

{
  "@context": "https://schema.org",
  "@type": "FAQPage"
}

Проверка выполняется через DevTools:

Elements → поиск application/ld+json → проверить "@type": "FAQPage"
Вебмастеры и индексация
Яндекс Вебмастер

Сайт добавлен в Яндекс Вебмастер.

Подтверждение прав выполнено через HTML-файл:

public/yandex_cd192b2d43f6e674.html

Production-проверка файла:

https://www.energoeffekt-rostov.ru/yandex_cd192b2d43f6e674.html

Статус sitemap в Яндекс Вебмастере:

sitemap.xml — OK
количество ссылок — 14
Google Search Console

Сайт добавлен в Google Search Console.

Тип ресурса:

URL prefix / Префикс URL

Подтверждение прав выполнено через HTML-файл:

public/google6a7aad73ef6a2606.html

Production-проверка файла:

https://www.energoeffekt-rostov.ru/google6a7aad73ef6a2606.html

Статус sitemap в Google Search Console:

sitemap.xml — Успешно
количество выявленных страниц — 14

Важно: файлы подтверждения Яндекс и Google нельзя удалять, иначе подтверждение прав может быть отменено.

PageSpeed / Lighthouse

В рамках ЭЭ-5 проведена базовая проверка PageSpeed / Lighthouse.

Результаты:

Home / Mobile:
Performance — 92
Accessibility — 90
Best Practices — 100
SEO — 100
Agent — 1/3

Home / Desktop:
Performance — 99
Accessibility — 93
Best Practices — 100
SEO — 100
Agent — 1/3

Product /solutions/bmk / Mobile:
Performance — 88
Accessibility — 90
Best Practices — 100
SEO — 100
Agent — 1/3

Product /solutions/bmk / Desktop:
Performance — 100
Accessibility — 93
Best Practices — 100
SEO — 100
Agent — 1/3

После добавления реальных изображений кейсов рекомендуется повторить Lighthouse-проверку главной и /cases, особенно mobile Performance и LCP.

PrivacyPage

Страница:

src/pages/PrivacyPage/PrivacyPage.jsx

Маршрут:

/privacy

Страница нужна для юридической готовности MVP и формы заявки.

Реализовано:

визуальная структура в стиле сайта;
SectionHeader;
поясняющий notice-блок;
карточка с разделами политики;
реквизиты оператора персональных данных;
раздел cookies;
расширенные юридические разделы;
desktop/mobile стили.

В PrivacyPage есть разделы:

Оператор персональных данных
Какие данные могут собираться
Технические данные
Файлы и вложения
Для чего используются данные
Правовое основание обработки
Cookies и аналитика
Подробнее о cookies
Хранение и защита данных
Передача данных третьим лицам
Трансграничная передача данных
Согласие пользователя
Отзыв согласия
Контакты по вопросам обработки данных

Полные реквизиты оператора:

Полное наименование: ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ЭНЕРГОЭФФЕКТ»
ИНН: 6161070112
ОГРН: 1146193000480
Юридический адрес: 344113, Россия, Ростовская область, г. Ростов-на-Дону, б-р Комарова, зд. 28/2, ком. 19
Email: sales@ee-don.ru
Телефон: +7 800 444-07-66
CookieBanner

Компонент:

src/components/CookieBanner/CookieBanner.jsx
src/components/CookieBanner/index.js

Реализовано:

cookie-баннер появляется при первом заходе;
кнопка “Хорошо” скрывает баннер;
согласие сохраняется в localStorage;
после обновления страницы баннер повторно не появляется;
ссылка “Подробнее” ведёт на /privacy#cookies;
добавлены desktop/mobile стили.

Ключ в localStorage:

ee_cookie_consent

Важно: текущий CookieBanner является MVP-уведомлением и не реализует расширенное управление категориями cookies.

Проверка баннера:

Открыть сайт.
Убедиться, что баннер появился.
Нажать “Хорошо”.
Обновить страницу.
Убедиться, что баннер повторно не появился.

Для повторной проверки можно удалить ключ:

Application → Local Storage → https://www.energoeffekt-rostov.ru → ee_cookie_consent
Стили

Часть базовых стилей вынесена в:

src/styles/
  variables.css
  global.css
  layout.css

Назначение:

variables.css

Цвета, размеры, базовые переменные дизайн-системы.

global.css

Глобальные правила:

html;
body;
ссылки;
формы;
scroll-behavior;
scroll-padding-top.
layout.css

Базовая компоновка:

.site;
.container;
.section;
.section__head.

Основные компонентные стили пока находятся в:

src/App.css

В App.css также находятся стили:

карточек;
секций;
формы;
FAQ;
PrivacyPage;
CookieBanner;
EntitySwitcher;
активного пункта навигации Header.

Дополнительно в App.css объявлена переменная:

:root {
  --container-padding: 24px;
}

Она используется для mobile-поведения горизонтальной ленты EntitySwitcher.

Важно: часть CSS пока остаётся монолитной. Дальнейшее разделение CSS по компонентам вынесено в будущие этапы.

Scroll-эффекты и микропереходы

Для управления прокруткой используется:

src/components/ScrollToTop/ScrollToTop.jsx

Реализовано:

плавная якорная навигация по секциям главной страницы;
учёт высоты sticky header при переходах к секциям;
корректное открытие обычных страниц сверху;
корректная обработка /privacy#cookies;
микропереходы с карточек продуктов и услуг;
переход с карточки продукта/услуги сначала к карточке заявки, затем плавный скролл вверх страницы;
контекстное поведение логотипа:
с главной страницы — smooth-scroll наверх;
со страницы продукта — переход на главную в блок «Продуктовые направления», затем скролл наверх;
со страницы услуги — переход на главную в блок «Услуги», затем скролл наверх;
с прочих страниц — переход на главную вверх;
временное отключение глобального CSS smooth-scroll на время кастомных JS-анимаций;
восстановление глобального smooth-scroll после завершения кастомной анимации.

Основные сценарии передаются через React Router location.state:

lead-card-then-top  переход с карточки продукта/услуги к заявке и плавный подъём наверх
products-then-top   переход на главную в блок продуктов и плавный подъём наверх
services-then-top   переход на главную в блок услуг и плавный подъём наверх
top-smooth          мягкий переход к верхней части главной страницы

Карточки продуктов и услуг имеют hover/leaving состояния:

hover — лёгкий подъём карточки и усиление тени;
leaving — короткая реакция карточки перед переходом на новую страницу.

Важно: глобальное правило в src/styles/global.css сохранено:

scroll-behavior: smooth;

Для специальных JS-сценариев оно временно отключается внутри ScrollToTop.jsx, чтобы не было конфликта CSS smooth-scroll и ручной анимации через window.scrollTo().

Header

Header:

sticky;
адаптирован под desktop и mobile;
логотип кликабельный;
навигация строится из src/data/navigation.js;
на мобильной версии меню прокручивается горизонтально;
активный пункт навигации подсвечивается на desktop и mobile.

Поведение логотипа:

если пользователь находится на главной странице, клик по логотипу плавно скроллит страницу наверх;
если пользователь находится на странице продукта /solutions/..., клик по логотипу переводит на главную страницу в секцию #products, затем запускает плавный скролл наверх;
если пользователь находится на странице услуги /services/..., клик по логотипу переводит на главную страницу в секцию #services, затем запускает плавный скролл наверх;
если пользователь находится на другой внутренней странице, клик по логотипу переводит на главную страницу вверх.

Логика активного пункта навигации:

/solutions/* → Продукция
/services/*  → Услуги
/cases        → Кейсы
/contacts     → Контакты

На главной странице активный пункт определяется по текущей секции:

#products  → Продукция
#services  → Услуги
#cases     → Кейсы
#contacts  → Контакты

За это отвечают:

src/components/Header/Header.jsx
src/components/ScrollToTop/ScrollToTop.jsx
src/data/navigation.js
Footer

Footer содержит:

краткое позиционирование Энергоэффект;
краткий юридический минимум;
навигацию;
блок экосистемы;
контакты.

Юридический минимум в footer:

© ООО «Энергоэффект»
ИНН: 6161070112

Полный юридический адрес и ОГРН в footer не добавляются, чтобы не перегружать подвал.

Контакты в footer:

Телефон: +7 800 444-07-66
Email: sales@ee-don.ru

Экосистема:

Энергоэффект — производственные решения
ТД Энергоэффект — комплектация инженерных объектов
Теплоучет — оборудование и комплектующие

Внешние ссылки:

https://td-energoeffect.ru/
https://teplouchet.com/

Ссылка «Энергоэффект — производственные решения» должна выполнять полноценный переход на главную страницу через React Router, а не просто поднимать текущую страницу вверх.

Проверочные сценарии

После изменений нужно проверять:

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
 /contacts
 /privacy
 /privacy#cookies
 /test-error-page

Также проверить:

отправку заявки с главной;
отправку заявки со страницы продукта;
отправку заявки со страницы услуги;
отправку заявки с файлом;
получение email-уведомления;
получение email-уведомления с вложением;
предупреждение под полем файла;
отображение заявки в Django Admin;
desktop;
mobile;
sticky header;
footer;
cookie-баннер;
якорную навигацию;
/contacts → /#contacts;
/privacy#cookies;
блок кейсов на главной;
страницу /cases;
отображение cover-фото кейсов;
отсутствие ложных переходов на несуществующие детальные страницы кейсов.
Проверка EntitySwitcher
Продуктовые страницы

Проверить:

/solutions/bmk
/solutions/btp
/solutions/vns
/solutions/pns
/solutions/automation-cabinets

Ожидаемое поведение:

отображается продуктовый переключатель;
в переключателе есть только продукты;
активный продукт подсвечен;
переходы между продуктами работают;
Header подсвечивает пункт «Продукция»;
лишнего дублирующего бейджа над H1 нет;
mobile-лента не ломает вертикальный scroll;
при выборе ПНС продуктовый переключатель не уезжает влево без необходимости.
Сервисные страницы

Проверить:

/services/design
/services/construction-installation
/services/commissioning

Ожидаемое поведение:

отображается переключатель услуг;
в переключателе есть только услуги;
активная услуга подсвечена;
переходы между услугами работают;
Header подсвечивает пункт «Услуги»;
лишнего дублирующего бейджа над H1 нет;
mobile-лента не ломает вертикальный scroll;
СМР корректно позиционируется в mobile-переключателе;
ПНР не уходит в размытие или визуальное обрезание.
Проверка активной навигации
Desktop

Проверить:

/solutions/bmk              → активна Продукция
/solutions/pns              → активна Продукция
/services/design            → активны Услуги
/services/commissioning     → активны Услуги
/cases                      → активны Кейсы

На главной странице при прокрутке:

#products  → активна Продукция
#services  → активны Услуги
#cases     → активны Кейсы
#contacts  → активны Контакты
Mobile

Проверить те же сценарии в мобильной ширине:

360 px
390 px
430 px
768 px
960 px

Ожидаемое поведение:

активный пункт меню подсвечивается;
горизонтальная навигация Header не ломается;
активный пункт не мешает клику;
scrollspy не вызывает рывков страницы.
Дополнительные scroll/transition сценарии

Проверить:

Клик по карточке продукта на главной
карточка получает micro-interaction;
открывается страница продукта;
экран сначала попадает к карточке заявки;
затем плавно поднимается вверх страницы.
Клик по карточке услуги на главной
карточка получает micro-interaction;
открывается страница услуги;
экран сначала попадает к карточке заявки;
затем плавно поднимается вверх страницы.
Клик по логотипу на главной
страница плавно скроллится наверх.
Клик по логотипу со страницы продукта
происходит переход на главную в блок «Продуктовые направления»;
затем запускается плавный скролл наверх.
Клик по логотипу со страницы услуги
происходит переход на главную в блок «Услуги»;
затем запускается плавный скролл наверх.
Клик по ссылке «Энергоэффект — производственные решения» в footer
должен происходить полноценный переход на главную страницу;
не должно быть простого подъёма текущей страницы вверх.
Клик по “Смотреть все кейсы”
с главной должен открываться маршрут /cases;
страница /cases должна показывать все кейсы из src/data/cases.js.
Клик по “Обсудить похожую задачу”
со страницы /cases должен вести к контактному блоку главной страницы.
Production-проверки

После deploy обязательно проверить прямые заходы:

https://www.energoeffekt-rostov.ru/
https://www.energoeffekt-rostov.ru/about
https://www.energoeffekt-rostov.ru/solutions/bmk
https://www.energoeffekt-rostov.ru/solutions/pns
https://www.energoeffekt-rostov.ru/services/design
https://www.energoeffekt-rostov.ru/services/commissioning
https://www.energoeffekt-rostov.ru/cases
https://www.energoeffekt-rostov.ru/contacts
https://www.energoeffekt-rostov.ru/privacy
https://www.energoeffekt-rostov.ru/privacy#cookies

Важно: production-сервер должен отдавать index.html для React Router маршрутов.

Если SPA fallback на сервере/nginx не настроен, прямые заходы на внутренние маршруты могут дать 404 до загрузки React.

На текущем production-сервере SPA fallback настроен через nginx:

location / {
    try_files $uri $uri/ /index.html;
}

После добавления будущих маршрутов /cases/:slug нужно будет проверить прямые заходы на каждую детальную страницу кейса.

Что не используется

На этом этапе намеренно не добавлялись:

Redux;
TypeScript migration;
CMS;
i18n;
auth;
личный кабинет;
калькуляторы;
тяжёлые UI-библиотеки;
CRM-интеграция;
расширенная система cookie-категорий;
банковские реквизиты в footer или контактный блок;
детальные страницы кейсов;
фильтры на странице кейсов.

Это соответствует MVP-подходу.

ЭЭ-5 — выполнено

В рамках ЭЭ-5 завершено:

Финальный smoke-test production-маршрутов.
Проверка canonical URL под www.
Проверка robots.txt и sitemap.xml под production-домен.
Проверка OpenGraph после deploy.
Проверка Organization JSON-LD.
Подключение Яндекс Вебмастера.
Подключение Google Search Console.
Отправка sitemap.xml в Яндекс Вебмастер.
Отправка sitemap.xml в Google Search Console.
Проверка формы заявки.
Проверка заявки с файлом.
Проверка email-уведомлений.
Проверка Django Admin.
Security cleanup production .env.
Проверка PageSpeed / Lighthouse.
Проверка mobile-отображения 360 / 390 / 430 / 768 px.
Проверка контактных данных.
Проверка кликабельности телефона.
Проверка статуса git и production-сервиса.
ЭЭ-5.2 — выполнено

В рамках ЭЭ-5.2 завершено:

Добавлен универсальный компонент EntitySwitcher.
Добавлен переключатель продуктов на страницах /solutions/*.
Добавлен переключатель услуг на страницах /services/*.
Продукты и услуги не смешиваются между собой.
Добавлены поля switcherTitle и theme в data-файлы продуктов и услуг.
Заложена основа для будущей визуальной индивидуализации продуктовых и сервисных страниц.
Убран дублирующий верхний бейдж на страницах продуктов и услуг.
Сохранены H1, SEO, FAQ, форма заявки и существующие маршруты.
Реализована mobile-лента переключателя.
Исправлено лишнее смещение продуктового переключателя на mobile.
Убраны blur/fade/chevron-подсказки переключателя.
Сохранено корректное вертикальное scroll-поведение.
Добавлена активная подсветка пункта навигации Header на desktop и mobile.
Добавлена route-based подсветка для /solutions/* и /services/*.
Добавлена section-based подсветка навигации на главной странице.
Page transition animation через opacity + translateX осознанно отложена.
npm run build проходит без ошибок.
Последние выполненные frontend-улучшения

Выполнено после ЭЭ-5.2:

Главная страница сокращена.
С главной удалены блоки Инженерная экспертиза и Производственный процесс.
Навигация очищена от пункта Решения, который вёл на удалённый #expertise.
Карточки продукции переработаны в визуальные карточки направлений.
В карточках продукции добавлена поддержка логотипов линеек.
Карточки услуг переработаны в более чистый B2B-формат.
Из карточек услуг убраны лишние маркеры Проектирование / СМР / ПНР.
Добавлен единый файл src/data/cases.js.
Добавлен компонент CaseCard.
На главную добавлены реальные cover-фото избранных кейсов.
Страница /cases перестала быть заглушкой и показывает все доступные кейсы.
Добавлены реальные папки с фото объектов в src/assets/cases.
CSS кейсов очищен без наслаивания лишних override-блоков.
Добавлена переменная --container-padding для mobile-ленты EntitySwitcher.
npm run build проходит успешно.
Следующие этапы

Рекомендуется вынести в следующие ТЗ:

Создать детальную страницу одного кейса, пилот: /cases/bmk-fok-elista.
Добавить маршрут /cases/:slug.
Подключить ограниченную галерею фото для пилотного кейса.
Добавить структуру детальной страницы кейса: Hero, AI Summary, что выполнено, особенности, галерея, связанные продукты/услуги, CTA.
Обновить sitemap.xml после появления детальных страниц кейсов.
Повторно проверить Lighthouse после подключения галерей.
Оптимизировать изображения кейсов.
Дальнейшая работа с Core Web Vitals.
Расширенная mobile-адаптация.
Дальнейшее разделение CSS по компонентам.
Подключение аналитики после согласования политики cookies.
Подготовка юридического текста к финальной проверке юристом.
Расширение контента продуктовых страниц.
Расширение контента сервисных страниц.
Подготовка следующих интеграций: CRM, аналитика, расширенные события формы заявки.
Отдельная проработка page transition animation, если будет принято решение добавить анимацию смены продуктовых и сервисных страниц.
Важное production-замечание

Файл .env не должен попадать в GitHub.

В отчётах, скриншотах и переписках нельзя распространять:

реальные production-пароли;
SMTP-пароли;
SECRET_KEY;
доступы к базе данных;
приватные ключи;
deploy key private part.

В GitHub допустимо хранить только .env.example без секретов.