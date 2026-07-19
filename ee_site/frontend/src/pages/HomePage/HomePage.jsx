// =========================================================
// HOME PAGE / ГЛАВНАЯ СТРАНИЦА
// Главная страница сайта ООО «Энергоэффект».
// Собирает основные MVP-блоки: Hero, AI summary,
// продукты, услуги, кейсы и заявку.
// =========================================================

import { Link } from "react-router-dom";

import { useState } from "react";

import heroImage from "../../assets/hero.jpg";
import AiSummary from "../../components/AiSummary";
import CaseCard from "../../components/CaseCard";
import Hero from "../../components/Hero";
import LeadForm from "../../components/LeadForm";
import ProductCard from "../../components/ProductCard";
import SectionHeader from "../../components/SectionHeader";
import ServiceCard from "../../components/ServiceCard";
import Seo from "../../components/Seo";
import { featuredCases } from "../../data/cases";
import { products } from "../../data/products";
import { services } from "../../data/services";


function HomePage() {
  const [openContactNotes, setOpenContactNotes] = useState({});

  const toggleContactNote = (key) => {
    setOpenContactNotes((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };
  return (
    <main>
      <Seo
        title="Энергоэффект — производство БМК, БТП, ВНС, ПНС и инженерные услуги"
        description="ООО «Энергоэффект» проектирует и производит БМК, БТП, ВНС, ПНС, шкафы управления и выполняет проектирование, СМР и пусконаладку инженерных объектов."
        path="/"
      />

      <Hero image={heroImage} />

      {/* =========================================================
          AI SUMMARY / КРАТКО О ГЛАВНОЙ СТРАНИЦЕ
          Блок помогает пользователю, поисковику и AI-агенту
          быстро понять содержание страницы.
          ========================================================= */}

      <section className="section section--summary">
        <div className="container">
          <AiSummary
              title="Кратко о сайте"
              lead="Сайт ООО «Энергоэффект» помогает выбрать инженерное решение или услугу и отправить исходные данные для первичной оценки задачи."
              items={[
                {
                  label: "Направления",
                  text: "Можно выбрать БМК, БТП, ВНС, ПНС, шкафы управления или инженерные услуги.",
                },
                {
                  label: "Подход",
                  text: "Задача рассматривается как инженерная система с учётом проекта, условий эксплуатации, сроков и исходных данных.",
                },
                {
                  label: "Для заявки",
                  text: "Можно отправить ТЗ, проект, спецификацию, опросный лист или описание задачи.",
                },
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
              title="Заводские инженерные системы под задачи объекта"
              description="Производим котельные, тепловые пункты, насосные станции и шкафы управления. Подбираем оборудование под проект, параметры объекта и условия эксплуатации."
          />

          <div className="product-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.slug} />
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
              title="Проектирование, монтаж и наладка инженерных систем"
              description="Выполняем работы для котельных, тепловых пунктов, насосных станций, узлов учёта и инженерных сетей: от проектных решений до подготовки к эксплуатации."
          />

          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard service={service} key={service.slug} />
            ))}
          </div>
        </div>
      </section>


      {/* =========================================================
            CASES / РЕАЛИЗОВАННЫЕ ЗАДАЧИ
            Короткая витрина доверия на главной.
            Полная архитектура кейсов будет развиваться через:
            /cases и будущие детальные страницы /cases/:slug.
            ========================================================= */}

        <section className="section" id="cases">
          <div className="container">
            <SectionHeader
              title="Реализованные задачи и инженерные решения"
              description="Короткая витрина объектов и задач, где важны техническая ответственность, надёжность оборудования и понятный результат для заказчика."
            />

            <div className="cases-grid">
              {featuredCases.map((caseItem) => (
                  <CaseCard caseItem={caseItem} key={caseItem.slug} />
              ))}
            </div>

            <div className="cases-actions">
              <Link className="cases-link" to="/cases">
                Смотреть все кейсы
              </Link>
            </div>
          </div>
        </section>



    {/* =========================================================
    CONTACTS / КОНТАКТЫ И ЗАЯВКА
    Единый финальный CTA-блок главной страницы.
    Сюда ведут пункты “Контакты” из header и footer.
    Отдельную страницу контактов в пользовательском сценарии
    не используем, чтобы не дробить путь клиента.
    ========================================================= */}

      <section className="section section--contact" id="contacts">
          <div className="container contact-grid">
            <div className="contact-content">
              <SectionHeader
                eyebrow="Контакты"
                title="Обсудить задачу"
              />

              <div
                className={`contact-note contact-note--secondary contact-note--collapsible ${
                  openContactNotes.send ? "contact-note--open" : ""
                }`}
              >
                <button
                  className="contact-note__summary"
                  type="button"
                  aria-expanded={Boolean(openContactNotes.send)}
                  onClick={() => toggleContactNote("send")}
                >
                  <strong>Что можно отправить:</strong>
                  <span className="contact-note__chevron" aria-hidden="true" />
                </button>

                <div className="contact-note__panel">
                  <div className="contact-note__content">
                    <span>
                      ТЗ, проект, спецификацию, опросный лист, фото объекта или краткое
                      описание задачи.
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`contact-note contact-note--collapsible ${
                  openContactNotes.contact ? "contact-note--open" : ""
                }`}
              >
                <button
                  className="contact-note__summary"
                  type="button"
                  aria-expanded={Boolean(openContactNotes.contact)}
                  onClick={() => toggleContactNote("contact")}
                >
                  <strong>Как с нами связаться:</strong>
                  <span className="contact-note__chevron" aria-hidden="true" />
                </button>

                <div className="contact-note__panel">
                  <div className="contact-note__content">
                    <span>
                      Телефон:{" "}
                      <a href="tel:+78004440766">+7 800 444-07-66</a>
                    </span>

                    <span>
                      Email:{" "}
                      <a href="mailto:sales@ee-don.ru">
                        sales@ee-don.ru
                      </a>
                    </span>

                    <span>Режим работы: Пн–Пт, 08:00–17:00</span>
                    <span>Заявку через сайт можно отправить в любое время.</span>
                  </div>
                </div>
              </div>

              <div
                className={`contact-note contact-note--secondary contact-note--collapsible ${
                  openContactNotes.details ? "contact-note--open" : ""
                }`}
              >
                <button
                  className="contact-note__summary"
                  type="button"
                  aria-expanded={Boolean(openContactNotes.details)}
                  onClick={() => toggleContactNote("details")}
                >
                  <strong>Реквизиты компании:</strong>
                  <span className="contact-note__chevron" aria-hidden="true" />
                </button>

                <div className="contact-note__panel">
                  <div className="contact-note__content">
                    <span>ООО «ЭНЕРГОЭФФЕКТ»</span>
                    <span>ИНН: 6161070112</span>
                    <span>ОГРН: 1146193000480</span>
                    <span>
                      Юр. адрес: Ростов-на-Дону, б-р Комарова, зд. 28/2, ком. 19
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <LeadForm products={products} services={services} />
          </div>
      </section>
    </main>
  );
}

export default HomePage;