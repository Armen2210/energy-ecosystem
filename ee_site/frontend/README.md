# Frontend сайта ООО «Энергоэффект»

Frontend-часть MVP сайта ООО «Энергоэффект».

Проект развивается как инженерная B2B-платформа: производственные решения, продуктовые направления, услуги, заявки, SEO-структура и задел под дальнейшее развитие экосистемы.

---

## Технологии

- React
- Vite
- React Router
- CSS Modules не используются
- Основные стили хранятся в обычных CSS-файлах
- Backend API: Django + DRF

---

## Назначение проекта

Frontend должен решать не только задачу «показать сайт», но и задачу B2B-продаж:

- показать Энергоэффект как инженерную производственную платформу;
- разделить продукты и услуги;
- дать пользователю понятный путь к заявке;
- подготовить структуру под SEO / GEO / AEO;
- создать масштабируемую основу для будущего инженерного портала.

---

## Продуктовые направления

Порядок продуктов фиксированный:

1. Блочно-модульные котельные
2. Блочные тепловые пункты
3. Водопроводные насосные станции
4. Пожарные насосные станции
5. Шкафы управления и автоматизации

Важно: в рамках проекта ЭЭ аббревиатура **ПНС** означает **пожарные насосные станции**.

---

## Услуги

Услуги отделены от продуктов:

1. Проектирование
2. Строительно-монтажные работы
3. Пусконаладка и ввод в эксплуатацию

Это важно для:

- SEO;
- UX;
- CRM-логики;
- будущих фильтров;
- AI-ready структуры.

---

## Структура проекта

```text
src/
  api/
    leadsApi.js

  assets/
    hero.jpg

  components/
    AiSummary/
    Footer/
    Header/
    Hero/
    InfoListBlock/
    LeadForm/
    ProcessSteps/
    ProductCard/
    ScrollToTop/
    SectionHeader/
    ServiceCard/
    TrustBlock/

  data/
    navigation.js
    products.js
    services.js

  pages/
    AboutPage/
    CasesPage/
    ContactsPage/
    HomePage/
    NotFoundPage/
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

карточках продуктов;
страницах продуктов;
форме заявки;
SEO-структуре.

Каждый продукт содержит:

slug
title
shortTitle
description
url
features
useCases
src/data/services.js

Единый источник данных для услуг.

Используется в:

карточках услуг;
страницах услуг;
форме заявки;
SEO-структуре.

Каждая услуга содержит:

slug
title
shortTitle
description
url
features
useCases
src/data/navigation.js

Единый источник данных для навигации.

Текущая логика:

верхнее меню ведёт по секциям главной landing-страницы;
отдельные страницы остаются доступными через карточки, footer и прямые URL;
главная страница работает как премиальная B2B-презентация.
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
/contacts                           Контакты
*                                   404
Главная страница

Главная страница построена как длинная landing-страница:

Hero
AI Summary
Продуктовые направления
Услуги
Инженерная экспертиза
Производственный процесс
Кейсы
Заявка
Footer

Главная — основной пользовательский сценарий.

Отдельные страницы нужны для:

SEO;
будущего расширения;
структуры инженерного портала;
продуктовых и сервисных посадочных страниц.
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
файл заявки передаётся в backend.
Переменные окружения

В корне frontend должен быть файл:

.env

Пример:

VITE_API_BASE_URL=http://127.0.0.1:8000

Также должен быть файл:

.env.example

Пример:

VITE_API_BASE_URL=http://127.0.0.1:8000
Запуск frontend

Перейти в папку frontend:

cd ee_site/frontend

Установить зависимости:

npm install

Запустить dev-сервер:

npm run dev

Открыть:

http://localhost:5173/
Backend для работы формы

Для проверки отправки заявки backend должен быть запущен отдельно:

cd ee_site/backend
.\.venv\Scripts\activate
python manage.py runserver

Backend API должен быть доступен по адресу:

http://127.0.0.1:8000/api/leads/
SEO foundation

Добавлены базовые SEO-файлы и настройки:

index.html
public/robots.txt
public/sitemap.xml

В index.html настроены:

title;
description;
canonical;
OpenGraph;
summary meta.

Проверка:

http://localhost:5173/robots.txt
http://localhost:5173/sitemap.xml
AI-ready структура

Используется компонент:

src/components/AiSummary/

Он применяется:

на главной странице;
на продуктовых страницах;
на страницах услуг.

Задача блока:

дать краткое содержание страницы пользователю;
улучшить машинопонятность страницы;
подготовить сайт к GEO / AEO / AI-ready подходу.
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
Scroll-эффекты и микропереходы

Для управления прокруткой используется:

src/components/ScrollToTop/ScrollToTop.jsx

Реализовано:

плавная якорная навигация;
учёт sticky header;
корректное открытие страниц сверху;
микропереходы с карточек продуктов и услуг;
мягкое поведение логотипа;
временное отключение глобального smooth-scroll при кастомных JS-анимациях.

Карточки продуктов и услуг имеют hover/leaving состояния.

Header

Header:

sticky;
адаптирован под desktop и mobile;
логотип кликабельный;
навигация строится из navigation.js;
на мобильной версии меню прокручивается горизонтально.
Footer

Footer содержит:

краткое позиционирование Энергоэффект;
навигацию;
блок экосистемы;
контакты.

Экосистема:

Энергоэффект — производственные решения
ТД Энергоэффект — комплектация инженерных объектов
Теплоучет — оборудование и комплектующие

Внешние ссылки:

https://td-energoeffect.ru/
https://teplouchet.com/
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
 /test-error-page

Также проверить:

отправку заявки с главной;
отправку заявки со страницы продукта;
отправку заявки со страницы услуги;
отправку заявки с файлом;
отображение заявки в Django Admin;
desktop;
mobile;
sticky header;
footer;
якорную навигацию.
Что не используется

На этом этапе намеренно не добавлялись:

Redux;
TypeScript migration;
CMS;
i18n;
auth;
личный кабинет;
калькуляторы;
тяжёлые UI-библиотеки.

Это соответствует MVP-подходу.

Следующие этапы

Рекомендуется вынести в следующие ТЗ:

Расширение контента продуктовых страниц.
Расширение контента сервисных страниц.
Реальные кейсы.
FAQ.
Политика обработки персональных данных.
Production-сборка frontend.
Dynamic meta для страниц.
Подготовка og:image.
Оптимизация изображений.
Проверка Core Web Vitals.
Дальнейшее разделение CSS по компонентам.