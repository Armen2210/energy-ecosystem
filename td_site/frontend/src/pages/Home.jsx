import { Link } from "react-router-dom"

import Header from "../components/Header"
import Seo from "../components/Seo"
import DirectionsBlock from "../components/DirectionsBlock"
import WorkSteps from "../components/WorkSteps"
import EcosystemSection from "../components/EcosystemSection"
import CasesPreview from "../components/CasesPreview"
import FaqSection from "../components/FaqSection"
import LeadForm from "../components/LeadForm"
import heroImage from "../assets/hero.png"

function Home() {
  return (
    <>
      <Seo
          title="ТД Энергоэффект — комплектация инженерных объектов"
          description="Комплектация инженерных объектов, подбор оборудования, поставка инженерных решений и сопровождение проектов."
          path="/"
      />
      <Header />

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero__grid">
              <div className="hero__content">
                <p className="hero__label">
                  Инженерная экосистема Энергоэффект
                </p>

                <h1 className="hero__title">
                  Комплектуем инженерные объекты под задачи проекта
                </h1>

                <p className="hero__text">
                  Помогаем подобрать оборудование, организовать поставку и найти
                  оптимальное решение для инженерных объектов различной
                  сложности.
                </p>

                <div className="hero__actions">
                  <Link to="/contacts" className="btn btn--primary">
                    Обсудить проект
                  </Link>

                  <a href="tel:+79381693109" className="btn btn--secondary">
                    Позвонить менеджеру
                  </a>
                </div>

                <p className="hero__trust">
                  Комплектация • Производство • Инженерные решения
                </p>
              </div>

              <div className="hero__visual" aria-hidden="true">
                <img src={heroImage} alt="" />
              </div>
            </div>
          </div>
        </section>

        <DirectionsBlock />

        <section className="expertise section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Инженерная экспертиза</p>

              <h2 className="section__title">
                Помогаем решать задачи инженерных объектов
              </h2>

              <p className="section__text">
                Работаем с задачами комплектации, подбора оборудования и
                организации поставок для объектов различной сложности.
              </p>
            </div>

            <div className="expertise__grid">
              <article className="expertise-card expertise-card--large">
                <span className="expertise-card__number">01</span>

                <h3>Комплектация объектов</h3>

                <p>
                  Помогаем организовать поставки оборудования и материалов под
                  задачи инженерного проекта.
                </p>
              </article>

              <article className="expertise-card">
                <span className="expertise-card__number">02</span>

                <h3>Подбор оборудования</h3>

                <p>
                  Подбираем решения под проектную документацию, требования
                  объекта и особенности реализации.
                </p>
              </article>

              <article className="expertise-card">
                <span className="expertise-card__number">03</span>

                <h3>Поиск аналогов</h3>

                <p>
                  Предлагаем альтернативные решения под сроки, бюджет и
                  доступность оборудования.
                </p>
              </article>

              <article className="expertise-card">
                <span className="expertise-card__number">04</span>

                <h3>Координация поставок</h3>

                <p>
                  Помогаем выстраивать поставки оборудования для различных
                  этапов реализации объекта.
                </p>
              </article>

              <article className="expertise-card">
                <span className="expertise-card__number">05</span>

                <h3>Работа по проекту</h3>

                <p>
                  Взаимодействуем с проектными, строительными и монтажными
                  организациями.
                </p>
              </article>
            </div>
          </div>
        </section>



        <WorkSteps />

        <EcosystemSection />

        <CasesPreview />

        <FaqSection />

        <LeadForm />
      </main>
    </>
  )
}

export default Home