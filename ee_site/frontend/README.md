# Frontend сайта ООО «Энергоэффект»

Frontend-часть production-сайта ООО «Энергоэффект».

Проект развивается как инженерная B2B-платформа: производственные решения, продуктовые направления, услуги, заявки, SEO-структура, AEO/GEO-ready подход и задел под дальнейшее развитие экосистемы.

---

## Production-статус

Сайт размещён в production.

Основной рабочий адрес:

```text
https://www.energoeffekt-rostov.ru
```

Домен без `www` перенаправляет на основной адрес:

```text
https://energoeffekt-rostov.ru → https://www.energoeffekt-rostov.ru
```

В production проверено:

* frontend открывается;
* HTTPS работает;
* домен с `www` открывается;
* домен без `www` перенаправляет на основной адрес;
* внутренние React-маршруты открываются;
* прямые заходы на внутренние маршруты работают;
* SPA fallback работает через nginx;
* `/contacts` перенаправляет пользователя к контактному блоку главной страницы;
* форма заявки отправляется;
* заявка сохраняется в backend / базе данных;
* файл заявки загружается и сохраняется;
* заявка отображается в Django Admin;
* email-уведомление менеджеру отправляется;
* email с вложением приходит;
* cookie-баннер работает;
* страница политики обработки персональных данных доступна;
* robots.txt доступен;
* sitemap.xml доступен;
* Яндекс Вебмастер подключён;
* Google Search Console подключён.

Production-проверки ЭЭ-5:

```text
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
```

Прямые заходы проверены:

```text
/solutions/bmk                      ок
/services/design                    ок
/privacy                            ок
```

Admin-проверка:

```text
Django Admin открывается
заявки отображаются
заявка без файла сохраняется
заявка с файлом сохраняется
source_page сохраняется
source_system сохраняется
```

Email-проверка:

```text
письмо без файла приходит
письмо с файлом приходит
вложение в письме есть
служебная фраза про Django Admin из письма удалена
```

Контактные данные production:

```text
Телефон: +7 800 444-07-66
tel-ссылка: tel:+78004440766
Email: sales@ee-don.ru
```

Состояние сервера после ЭЭ-5:

```text
git status — рабочая ветка main актуальна
untracked — только ee_site/backend/.env.backup...
ee_site_gunicorn.service — active (running)
```

Файл `.env.backup...` не добавляется в Git и не коммитится.

---

## Технологии

* React
* Vite
* React Router
* CSS Modules не используются
* Основные стили хранятся в обычных CSS-файлах
* Backend API: Django + DRF
* Production-раздача frontend: nginx
* Production backend: Django + Gunicorn + PostgreSQL

---

## Назначение проекта

Frontend должен решать не только задачу «показать сайт», но и задачу B2B-продаж:

* показать Энергоэффект как инженерную производственную платформу;
* разделить продукты и услуги;
* дать пользователю понятный путь к заявке;
* подготовить структуру под SEO / GEO / AEO;
* создать масштабируемую основу для будущего инженерного портала;
* обеспечить юридически корректную базу: политика персональных данных, согласие в форме, cookies, реквизиты компании.

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

* SEO;
* UX;
* CRM-логики;
* будущих фильтров;
* AI-ready структуры.

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
    CookieBanner/
    FAQ/
    Footer/
    Header/
    Hero/
    InfoListBlock/
    LeadForm/
    ProcessSteps/
    ProductCard/
    ScrollToTop/
    SectionHeader/
    Seo/
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

* карточках продуктов;
* страницах продуктов;
* форме заявки;
* SEO-структуре;
* FAQ / AEO-ready структуре.

Каждый продукт содержит:

* `slug`
* `title`
* `shortTitle`
* `description`
* `url`
* `features`
* `useCases`
* `faq`

### `src/data/services.js`

Единый источник данных для услуг.

Используется в:

* карточках услуг;
* страницах услуг;
* форме заявки;
* SEO-структуре;
* FAQ / AEO-ready структуре.

Каждая услуга содержит:

* `slug`
* `title`
* `shortTitle`
* `description`
* `url`
* `features`
* `useCases`
* `faq`

### `src/data/navigation.js`

Единый источник данных для навигации.

Текущая логика:

* верхнее меню ведёт по секциям главной landing-страницы;
* отдельные страницы остаются доступными через карточки, footer и прямые URL;
* главная страница работает как премиальная B2B-презентация.

---

## Основные маршруты

Используется `react-router-dom`.

```text
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
```

Маршрут `/contacts` не используется как отдельная пользовательская страница. Он перенаправляет пользователя на контактный блок главной страницы:

```text
/contacts → /#contacts
```

Это сделано для того, чтобы не дробить основной сценарий обращения и вести пользователя сразу к форме заявки и контактной информации.

---

## Главная страница

Главная страница построена как длинная landing-страница:

1. Hero
2. AI Summary
3. Продуктовые направления
4. Услуги
5. Инженерная экспертиза
6. Производственный процесс
7. Кейсы
8. Контакты / заявка
9. Footer

Главная — основной пользовательский сценарий.

Отдельные страницы нужны для:

* SEO;
* AEO/GEO;
* будущего расширения;
* структуры инженерного портала;
* продуктовых и сервисных посадочных страниц.

На главной странице используются якорные секции:

```text
#products   Продуктовые направления
#services   Услуги
#expertise  Инженерная экспертиза
#production Производственный процесс
#cases      Кейсы
#contacts   Контакты и заявка
```

---

## Контактный блок главной страницы

Блок `#contacts` является основной точкой обращения пользователя.

В нём есть:

* заголовок “Обсудить задачу”;
* карточка “Что можно отправить”;
* карточка “Как с нами связаться”;
* карточка “Реквизиты компании”;
* форма заявки.

Карточки расположены в логике:

1. Что можно отправить
2. Как с нами связаться
3. Реквизиты компании

Контактные данные:

```text
Телефон: +7 800 444-07-66
Email: sales@ee-don.ru
```

Телефон отображается в читаемом формате, а `tel`-ссылка сохраняется в техническом формате:

```text
tel:+78004440766
```

Карточка реквизитов содержит краткий вариант:

```text
ООО «ЭНЕРГОЭФФЕКТ»
ИНН: 6161070112
ОГРН: 1146193000480
Юр. адрес: Ростов-на-Дону, б-р Комарова, зд. 28/2, ком. 19
```

Полные реквизиты оператора персональных данных находятся на странице `/privacy`.

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

Форма отправляет данные в backend:

```text
POST /api/leads/
```

Передаются:

* имя;
* компания;
* телефон;
* email;
* интересующее направление;
* описание задачи;
* файл;
* `source_page`;
* `source_system`.

Особенности:

* продукты и услуги подтягиваются из data-файлов;
* на странице продукта/услуги направление подставляется автоматически;
* выбранное направление добавляется в описание заявки;
* success/error состояния реализованы;
* success-сообщение плавно исчезает;
* файл заявки передаётся в backend;
* заявка сохраняется в базе данных;
* заявка отображается в Django Admin;
* после сохранения заявки отправляется email-уведомление менеджеру;
* вложение, если оно было прикреплено, приходит в письме;
* служебная фраза про Django Admin из письма удалена;
* есть согласие на обработку персональных данных;
* ссылка на политику из формы открывается в новой вкладке, чтобы пользователь не потерял заполненную заявку;
* для ссылки используется `rel="noopener noreferrer"`;
* под полем файла добавлено предупреждение о персональных данных третьих лиц.

Предупреждение под загрузкой файла:

```text
Не прикрепляйте документы, содержащие персональные данные третьих лиц,
если у вас нет права на их передачу.
```

На страницах продукта и услуги секция заявки имеет якорь:

```jsx
<section id="lead-form" className="section section--contact">
```

Это нужно для scroll-сценариев перехода с карточек продукта/услуги.

---

## Production API

В production frontend использует backend API по адресу:

```text
https://www.energoeffekt-rostov.ru/api/leads/
```

В корне frontend должен быть файл:

```text
.env
```

Production-пример:

```env
VITE_API_BASE_URL=https://www.energoeffekt-rostov.ru
```

Важно: после изменения `.env` frontend нужно пересобрать:

```bash
npm run build
```

---

## Переменные окружения для local/dev

Для локальной разработки используется `.env` в корне frontend.

Пример для локальной разработки:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Также должен быть файл:

```text
.env.example
```

Пример `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Файл `.env` не должен попадать в GitHub.

---

## Запуск frontend локально

Перейти в папку frontend:

```bash
cd ee_site/frontend
```

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

Открыть:

```text
http://localhost:5173/
```

---

## Backend для работы формы локально

Для проверки отправки заявки backend должен быть запущен отдельно:

```bash
cd ee_site/backend
.\.venv\Scripts\activate
python manage.py runserver
```

Backend API должен быть доступен по адресу:

```text
http://127.0.0.1:8000/api/leads/
```

---

## Production-сборка frontend

На production-сервере frontend расположен по пути:

```text
/var/www/ee_site/repo/ee_site/frontend
```

Установка зависимостей:

```bash
npm install
```

Сборка:

```bash
npm run build
```

Production-сборка создаётся в:

```text
dist/
```

Nginx раздаёт frontend из:

```text
/var/www/ee_site/repo/ee_site/frontend/dist
```

---

## Production backend / security cleanup

Production backend работает через Gunicorn:

```text
ee_site_gunicorn.service
```

После ЭЭ-5 проверено:

```text
ee_site_gunicorn.service — active (running)
```

Production `.env` очищен от временных dev/IP-значений.

Проверенные production-настройки:

```text
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=energoeffekt-rostov.ru,www.energoeffekt-rostov.ru
CSRF_TRUSTED_ORIGINS=https://energoeffekt-rostov.ru,https://www.energoeffekt-rostov.ru
```

Из production-настроек удалены:

```text
localhost
127.0.0.1
временные IP-адреса
```

Важно: `.env` и резервные копии `.env` не должны попадать в GitHub.

---

## SEO foundation

Добавлены и проверены базовые SEO-файлы и настройки:

* `index.html`
* `public/robots.txt`
* `public/sitemap.xml`
* `public/og-image.jpg`
* `public/yandex_cd192b2d43f6e674.html`
* `public/google6a7aad73ef6a2606.html`

В `index.html` настроены:

* title;
* description;
* canonical;
* OpenGraph;
* summary meta;
* Organization JSON-LD.

Проверка локально:

```text
http://localhost:5173/robots.txt
http://localhost:5173/sitemap.xml
```

Проверка production:

```text
https://www.energoeffekt-rostov.ru/robots.txt
https://www.energoeffekt-rostov.ru/sitemap.xml
https://www.energoeffekt-rostov.ru/og-image.jpg
```

Canonical-домен:

```text
https://www.energoeffekt-rostov.ru
```

Проверено:

```text
robots.txt использует актуальный sitemap
sitemap.xml использует актуальный www-домен
canonical использует актуальный www-домен
og:url использует актуальный www-домен
og:image использует актуальный www-домен
Organization JSON-LD найден
Organization JSON-LD содержит name, url, telephone, email
```

robots.txt:

```text
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://www.energoeffekt-rostov.ru/sitemap.xml
```

sitemap.xml содержит 14 индексируемых URL.

---

## SEO / AEO / GEO структура

В проекте используется компонент:

```text
src/components/Seo/
```

Он отвечает за динамические meta-данные страниц.

Также используется компонент:

```text
src/components/AiSummary/
```

Он применяется:

* на главной странице;
* на продуктовых страницах;
* на страницах услуг.

Задача блока:

* дать краткое содержание страницы пользователю;
* улучшить машинопонятность страницы;
* подготовить сайт к GEO / AEO / AI-ready подходу.

---

## FAQ и JSON-LD

На продуктовых и сервисных страницах добавлены FAQ-блоки.

FAQ используется не только как визуальный блок, но и как SEO/AEO/GEO-структура.

Компонент:

```text
src/components/FAQ/
```

Важно: на страницах с FAQ должен выводиться JSON-LD:

```html
<script type="application/ld+json">
```

Содержимое должно включать:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage"
}
```

Проверка выполняется через DevTools:

```text
Elements → поиск application/ld+json → проверить "@type": "FAQPage"
```

---

## Вебмастеры и индексация

### Яндекс Вебмастер

Сайт добавлен в Яндекс Вебмастер.

Подтверждение прав выполнено через HTML-файл:

```text
public/yandex_cd192b2d43f6e674.html
```

Production-проверка файла:

```text
https://www.energoeffekt-rostov.ru/yandex_cd192b2d43f6e674.html
```

Статус sitemap в Яндекс Вебмастере:

```text
sitemap.xml — OK
количество ссылок — 14
```

### Google Search Console

Сайт добавлен в Google Search Console.

Тип ресурса:

```text
URL prefix / Префикс URL
```

Подтверждение прав выполнено через HTML-файл:

```text
public/google6a7aad73ef6a2606.html
```

Production-проверка файла:

```text
https://www.energoeffekt-rostov.ru/google6a7aad73ef6a2606.html
```

Статус sitemap в Google Search Console:

```text
sitemap.xml — Успешно
количество выявленных страниц — 14
```

Важно: файлы подтверждения Яндекс и Google нельзя удалять, иначе подтверждение прав может быть отменено.

---

## PageSpeed / Lighthouse

В рамках ЭЭ-5 проведена базовая проверка PageSpeed / Lighthouse.

Результаты:

```text
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
```

---

## PrivacyPage

Страница:

```text
src/pages/PrivacyPage/PrivacyPage.jsx
```

Маршрут:

```text
/privacy
```

Страница нужна для юридической готовности MVP и формы заявки.

Реализовано:

* визуальная структура в стиле сайта;
* SectionHeader;
* поясняющий notice-блок;
* карточка с разделами политики;
* реквизиты оператора персональных данных;
* раздел cookies;
* расширенные юридические разделы;
* desktop/mobile стили.

В PrivacyPage есть разделы:

* Оператор персональных данных
* Какие данные могут собираться
* Технические данные
* Файлы и вложения
* Для чего используются данные
* Правовое основание обработки
* Cookies и аналитика
* Подробнее о cookies
* Хранение и защита данных
* Передача данных третьим лицам
* Трансграничная передача данных
* Согласие пользователя
* Отзыв согласия
* Контакты по вопросам обработки данных

Полные реквизиты оператора:

```text
Полное наименование: ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ «ЭНЕРГОЭФФЕКТ»
ИНН: 6161070112
ОГРН: 1146193000480
Юридический адрес: 344113, Россия, Ростовская область, г. Ростов-на-Дону, б-р Комарова, зд. 28/2, ком. 19
Email: sales@ee-don.ru
Телефон: +7 800 444-07-66
```

---

## CookieBanner

Компонент:

```text
src/components/CookieBanner/CookieBanner.jsx
src/components/CookieBanner/index.js
```

Реализовано:

* cookie-баннер появляется при первом заходе;
* кнопка “Хорошо” скрывает баннер;
* согласие сохраняется в localStorage;
* после обновления страницы баннер повторно не появляется;
* ссылка “Подробнее” ведёт на `/privacy#cookies`;
* добавлены desktop/mobile стили.

Ключ в localStorage:

```text
ee_cookie_consent
```

Важно: текущий CookieBanner является MVP-уведомлением и не реализует расширенное управление категориями cookies.

Проверка баннера:

1. Открыть сайт.
2. Убедиться, что баннер появился.
3. Нажать “Хорошо”.
4. Обновить страницу.
5. Убедиться, что баннер повторно не появился.

Для повторной проверки можно удалить ключ:

```text
Application → Local Storage → https://www.energoeffekt-rostov.ru → ee_cookie_consent
```

---

## Стили

Часть базовых стилей вынесена в:

```text
src/styles/
  variables.css
  global.css
  layout.css
```

Назначение:

### `variables.css`

Цвета, размеры, базовые переменные дизайн-системы.

### `global.css`

Глобальные правила:

* `html`;
* `body`;
* ссылки;
* формы;
* `scroll-behavior`;
* `scroll-padding-top`.

### `layout.css`

Базовая компоновка:

* `.site`;
* `.container`;
* `.section`;
* `.section__head`.

Основные компонентные стили пока находятся в:

```text
src/App.css
```

---

## Scroll-эффекты и микропереходы

Для управления прокруткой используется:

```text
src/components/ScrollToTop/ScrollToTop.jsx
```

Реализовано:

* плавная якорная навигация по секциям главной страницы;
* учёт высоты sticky header при переходах к секциям;
* корректное открытие обычных страниц сверху;
* корректная обработка `/privacy#cookies`;
* микропереходы с карточек продуктов и услуг;
* переход с карточки продукта/услуги сначала к карточке заявки, затем плавный скролл вверх страницы;
* контекстное поведение логотипа:

  * с главной страницы — smooth-scroll наверх;
  * со страницы продукта — переход на главную в блок «Продуктовые направления», затем скролл наверх;
  * со страницы услуги — переход на главную в блок «Услуги», затем скролл наверх;
  * с прочих страниц — переход на главную вверх;
* временное отключение глобального CSS smooth-scroll на время кастомных JS-анимаций;
* восстановление глобального smooth-scroll после завершения кастомной анимации.

Основные сценарии передаются через React Router `location.state`:

```text
lead-card-then-top  переход с карточки продукта/услуги к заявке и плавный подъём наверх
products-then-top   переход на главную в блок продуктов и плавный подъём наверх
services-then-top   переход на главную в блок услуг и плавный подъём наверх
top-smooth          мягкий переход к верхней части главной страницы
```

Карточки продуктов и услуг имеют hover/leaving состояния:

* hover — лёгкий подъём карточки и усиление тени;
* leaving — короткая реакция карточки перед переходом на новую страницу.

Важно: глобальное правило в `src/styles/global.css` сохранено:

```css
scroll-behavior: smooth;
```

Для специальных JS-сценариев оно временно отключается внутри `ScrollToTop.jsx`, чтобы не было конфликта CSS smooth-scroll и ручной анимации через `window.scrollTo()`.

---

## Header

Header:

* sticky;
* адаптирован под desktop и mobile;
* логотип кликабельный;
* навигация строится из `src/data/navigation.js`;
* на мобильной версии меню прокручивается горизонтально.

Поведение логотипа:

* если пользователь находится на главной странице, клик по логотипу плавно скроллит страницу наверх;
* если пользователь находится на странице продукта `/solutions/...`, клик по логотипу переводит на главную страницу в секцию `#products`, затем запускает плавный скролл наверх;
* если пользователь находится на странице услуги `/services/...`, клик по логотипу переводит на главную страницу в секцию `#services`, затем запускает плавный скролл наверх;
* если пользователь находится на другой внутренней странице, клик по логотипу переводит на главную страницу вверх.

За это отвечают:

```text
src/components/Header/Header.jsx
src/components/ScrollToTop/ScrollToTop.jsx
```

---

## Footer

Footer содержит:

* краткое позиционирование Энергоэффект;
* краткий юридический минимум;
* навигацию;
* блок экосистемы;
* контакты.

Юридический минимум в footer:

```text
© ООО «Энергоэффект»
ИНН: 6161070112
```

Полный юридический адрес и ОГРН в footer не добавляются, чтобы не перегружать подвал.

Контакты в footer:

```text
Телефон: +7 800 444-07-66
Email: sales@ee-don.ru
```

Экосистема:

```text
Энергоэффект — производственные решения
ТД Энергоэффект — комплектация инженерных объектов
Теплоучет — оборудование и комплектующие
```

Внешние ссылки:

```text
https://td-energoeffect.ru/
https://teplouchet.com/
```

Ссылка «Энергоэффект — производственные решения» должна выполнять полноценный переход на главную страницу через React Router, а не просто поднимать текущую страницу вверх.

---

## Проверочные сценарии

После изменений нужно проверять:

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
 /contacts
 /privacy
 /privacy#cookies
 /test-error-page
```

Также проверить:

* отправку заявки с главной;
* отправку заявки со страницы продукта;
* отправку заявки со страницы услуги;
* отправку заявки с файлом;
* получение email-уведомления;
* получение email-уведомления с вложением;
* предупреждение под полем файла;
* отображение заявки в Django Admin;
* desktop;
* mobile;
* sticky header;
* footer;
* cookie-баннер;
* якорную навигацию;
* `/contacts → /#contacts`;
* `/privacy#cookies`.

---

## Дополнительные scroll/transition сценарии

Проверить:

### Клик по карточке продукта на главной

* карточка получает micro-interaction;
* открывается страница продукта;
* экран сначала попадает к карточке заявки;
* затем плавно поднимается вверх страницы.

### Клик по карточке услуги на главной

* карточка получает micro-interaction;
* открывается страница услуги;
* экран сначала попадает к карточке заявки;
* затем плавно поднимается вверх страницы.

### Клик по логотипу на главной

* страница плавно скроллится наверх.

### Клик по логотипу со страницы продукта

* происходит переход на главную в блок «Продуктовые направления»;
* затем запускается плавный скролл наверх.

### Клик по логотипу со страницы услуги

* происходит переход на главную в блок «Услуги»;
* затем запускается плавный скролл наверх.

### Клик по ссылке «Энергоэффект — производственные решения» в footer

* должен происходить полноценный переход на главную страницу;
* не должно быть простого подъёма текущей страницы вверх.

---

## Production-проверки

После deploy обязательно проверить прямые заходы:

```text
https://www.energoeffekt-rostov.ru/
https://www.energoeffekt-rostov.ru/about
https://www.energoeffekt-rostov.ru/solutions/bmk
https://www.energoeffekt-rostov.ru/services/design
https://www.energoeffekt-rostov.ru/contacts
https://www.energoeffekt-rostov.ru/privacy
https://www.energoeffekt-rostov.ru/privacy#cookies
```

Важно: production-сервер должен отдавать `index.html` для React Router маршрутов.

Если SPA fallback на сервере/nginx не настроен, прямые заходы на внутренние маршруты могут дать 404 до загрузки React.

На текущем production-сервере SPA fallback настроен через nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Что не используется

На этом этапе намеренно не добавлялись:

* Redux;
* TypeScript migration;
* CMS;
* i18n;
* auth;
* личный кабинет;
* калькуляторы;
* тяжёлые UI-библиотеки;
* CRM-интеграция;
* расширенная система cookie-категорий;
* банковские реквизиты в footer или контактный блок.

Это соответствует MVP-подходу.

---

## ЭЭ-5 — выполнено

В рамках ЭЭ-5 завершено:

1. Финальный smoke-test production-маршрутов.
2. Проверка canonical URL под `www`.
3. Проверка `robots.txt` и `sitemap.xml` под production-домен.
4. Проверка OpenGraph после deploy.
5. Проверка Organization JSON-LD.
6. Подключение Яндекс Вебмастера.
7. Подключение Google Search Console.
8. Отправка sitemap.xml в Яндекс Вебмастер.
9. Отправка sitemap.xml в Google Search Console.
10. Проверка формы заявки.
11. Проверка заявки с файлом.
12. Проверка email-уведомлений.
13. Проверка Django Admin.
14. Security cleanup production `.env`.
15. Проверка PageSpeed / Lighthouse.
16. Проверка mobile-отображения 360 / 390 / 430 / 768 px.
17. Проверка контактных данных.
18. Проверка кликабельности телефона.
19. Проверка статуса git и production-сервиса.

---

## Следующие этапы

Рекомендуется вынести в следующие ТЗ:

1. Расширенная mobile-адаптация.
2. Оптимизация изображений.
3. Дальнейшая работа с Core Web Vitals.
4. Дальнейшее разделение CSS по компонентам.
5. Подключение аналитики после согласования политики cookies.
6. Подготовка юридического текста к финальной проверке юристом.
7. Расширение контента продуктовых страниц.
8. Расширение контента сервисных страниц.
9. Добавление реальных кейсов.
10. Подготовка следующих интеграций: CRM, аналитика, расширенные события формы заявки.

---

## Важное production-замечание

Файл `.env` не должен попадать в GitHub.

В отчётах, скриншотах и переписках нельзя распространять:

* реальные production-пароли;
* SMTP-пароли;
* `SECRET_KEY`;
* доступы к базе данных;
* приватные ключи;
* deploy key private part.

В GitHub допустимо хранить только `.env.example` без секретов.
