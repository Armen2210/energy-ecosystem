// =========================================================
// HOME PAGE / ГЛАВНАЯ СТРАНИЦА
// Главная страница сайта ООО «Энергоэффект».
// Собирает основные MVP-блоки: Hero, AI summary,
// продукты, услуги, экспертиза, процесс, кейсы и заявку.
// =========================================================

import heroImage from "../../assets/hero.jpg";

import AiSummary from "../../components/AiSummary";
import Hero from "../../components/Hero";
import LeadForm from "../../components/LeadForm";
import ProcessSteps from "../../components/ProcessSteps";
import ProductCard from "../../components/ProductCard";
import SectionHeader from "../../components/SectionHeader";
import ServiceCard from "../../components/ServiceCard";

import { products } from "../../data/products";
import { services } from "../../data/services";

// =========================================================
// ЭТАПЫ ПРОИЗВОДСТВЕННОГО ПРОЦЕССА
// Пока храним на главной странице.
// Позже можно вынести в src/data/processSteps.js.
// =========================================================

const productionSteps = [
  {
    title: "Исходные данные",
    description:
      "Фиксируем требования объекта, проектные условия, ограничения площадки и сроки.",
  },
  {
    title: "Техническое решение",
    description:
      "Подбираем состав оборудования и формируем инженерную логику будущей системы.",
  },
  {
    title: "Производство и сборка",
    description:
      "Собираем изделие с учётом требований проекта, эксплуатации и дальнейшего обслуживания.",
  },
  {
    title: "Готовое решение",
    description:
      "Передаём заказчику не набор оборудования, а готовую инженерную систему под задачу объекта.",
  },
];

function HomePage() {
  return (
    <main>
      <Hero image={heroImage} />

      {/* =========================================================
          AI SUMMARY / КРАТКО О ГЛАВНОЙ СТРАНИЦЕ
          Блок помогает пользователю, поисковику и AI-агенту
          быстро понять содержание страницы.
          ========================================================= */}

      <section className="section section--summary">
        <div className="container">
          <AiSummary
            title="Энергоэффект проектирует и производит инженерные системы для объектов"
            items={[
              "Продукты: БМК, БТП, ВНС, ПНС, шкафы управления и автоматизации.",
              "Услуги: проектирование, строительно-монтажные работы и пусконаладка.",
              "Сайт помогает быстро выбрать направление и отправить заявку с файлом.",
            ]}
          />
        </div>
      </section>

      {/* =========================================================
          PRODUCTS / ПРОДУКТОВЫЕ НАПРАВЛЕНИЯ
          Карточки строятся из src/data/products.js.
          ========================================================= */}

      <section className="section" id="products">
        <div className="container">
          <SectionHeader
            eyebrow="Продуктовые направления"
            title="Инженерные решения под задачи объекта"
            description="Мы не продаём отдельное оборудование ради оборудования. Мы собираем инженерную систему под требования проекта, площадки и эксплуатации."
          />

          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard product={product} index={index} key={product.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICES / УСЛУГИ
          Услуги отделены от продуктовых направлений.
          ========================================================= */}

      <section className="section" id="services">
        <div className="container">
          <SectionHeader
            eyebrow="Услуги"
            title="Работы вокруг инженерных объектов"
            description="Помимо производства оборудования, Энергоэффект выполняет инженерные работы, которые помогают довести объект до результата."
          />

          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard service={service} index={index} key={service.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          EXPERTISE / ИНЖЕНЕРНАЯ ЭКСПЕРТИЗА
          Тёмный блок, показывающий инженерный подход компании.
          ========================================================= */}

      <section className="section section--dark" id="expertise">
        <div className="container expertise">
          <SectionHeader
            eyebrow="Инженерная экспертиза"
            title="Сначала инженерная логика. Потом производство."
            description="Мы смотрим на объект как на систему: исходные данные, ограничения площадки, требования проекта, сроки, эксплуатация и ответственность за результат."
            theme="dark"
          />

          <div className="expertise-grid">
            <article className="expertise-card">
              <span>01</span>
              <h3>Разбираем задачу объекта</h3>
              <p>Уточняем условия, нагрузки, ограничения и требования к будущей системе.</p>
            </article>

            <article className="expertise-card">
              <span>02</span>
              <h3>Подбираем техническое решение</h3>
              <p>Формируем решение не “по шаблону”, а под конкретную инженерную ситуацию.</p>
            </article>

            <article className="expertise-card">
              <span>03</span>
              <h3>Учитываем производство</h3>
              <p>Сразу думаем о сборке, сроках, комплектации, монтаже и дальнейшей эксплуатации.</p>
            </article>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCTION / ПРОИЗВОДСТВЕННЫЙ ПРОЦЕСС
          MVP-блок процесса без отдельной сложной страницы.
          ========================================================= */}

      <section className="section" id="production">
        <div className="container">
          <SectionHeader
            eyebrow="Производственный процесс"
            title="От инженерной задачи до готового решения"
            description="Производство строится вокруг понятного процесса: анализ задачи, техническое решение, комплектация, сборка и передача результата заказчику."
          />

          <ProcessSteps steps={productionSteps} />
        </div>
      </section>

      {/* =========================================================
          CASES / КЕЙСЫ
          MVP-структура под будущие реальные проекты.
          ========================================================= */}

      <section className="section" id="cases">
        <div className="container">
          <SectionHeader
            eyebrow="Кейсы"
            title="Решения для объектов, где важна инженерная ответственность"
            description="Каждый проект начинается с задачи заказчика и заканчивается работающей инженерной системой, которую можно обслуживать, развивать и контролировать."
          />

          <div className="cases-grid">
            <article className="case-card">
              <span>БТП</span>
              <h3>Тепловой пункт для объекта капитального строительства</h3>
              <p>
                Подбор решения под параметры объекта, требования проекта и дальнейшую эксплуатацию.
              </p>
            </article>

            <article className="case-card">
              <span>БМК</span>
              <h3>Блочно-модульная котельная под задачу теплоснабжения</h3>
              <p>
                Производственное решение, рассчитанное на надёжность, сроки и понятную эксплуатацию.
              </p>
            </article>

            <article className="case-card">
              <span>ПНС</span>
              <h3>Пожарная насосная станция для системы безопасности</h3>
              <p>Вода под давлением тогда, когда это критически важно.</p>
            </article>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACTS / ЗАЯВКА
          MVP-блок для сбора заявок.
          ========================================================= */}

      <section className="section section--contact" id="contacts">
        <div className="container contact-grid">
          <div>
            <SectionHeader
              eyebrow="Заявка"
              title="Обсудим инженерную задачу вашего объекта"
              description="Оставьте контакты, кратко опишите задачу и приложите файл, если есть техническое задание, проект или спецификация."
            />

            <div className="contact-note">
              <strong>Что можно отправить:</strong>
              <span>ТЗ, проект, спецификацию, опросный лист или краткое описание объекта.</span>
            </div>
          </div>

          <LeadForm products={products} services={services} />
        </div>
      </section>
    </main>
  );
}

export default HomePage;