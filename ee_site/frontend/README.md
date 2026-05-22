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