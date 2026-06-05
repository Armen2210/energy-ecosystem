// =====================================================
// CasesPage сайта ТД «Энергоэффект»
//
// Страница кейсов и инженерных решений.
//
// Задачи страницы:
// - показать типовые инженерные задачи;
// - не использовать выдуманные KPI;
// - подготовить структуру под будущие реальные кейсы.
//
// Данные карточек вынесены в src/data/cases.js.
// =====================================================

import { useNavigate } from "react-router-dom"

import Header from "../../components/Header"
import Seo from "../../components/Seo"

import { caseItems, futureCaseCards } from "../../data/cases"

function CasesPage() {
  const navigate = useNavigate()

  // =====================================================
  // Переход к форме заявки на главной странице
  //
  // Страница /cases пока существует как отдельный маршрут,
  // но основной сценарий заявки переносим на главную страницу.
  // =====================================================
  const handleContactsNavigation = (event) => {
    event.preventDefault()

    navigate("/")

    window.setTimeout(() => {
      const contactsSection = document.getElementById("contacts")

      if (!contactsSection) {
        return
      }

      contactsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  return (
    <>
      <Seo
        title="Кейсы и инженерные решения — ТД Энергоэффект"
        description="Инженерные решения и примеры задач внутри экосистемы Энергоэффект: комплектация объектов, производственные решения и подбор оборудования."
        path="/cases"
      />

      <Header />

      <main className="page cases-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Кейсы</p>

            <h1 className="page__title">
              Инженерные решения внутри экосистемы Энергоэффект
            </h1>

            <p className="page__text">
              Раздел показывает типы задач и инженерных решений, которые могут
              закрываться внутри экосистемы. По мере появления новых проектов
              страница будет дополняться живыми примерами.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Подход к кейсам</p>

              <h2 className="section__title">
                Показываем задачи без выдуманных показателей
              </h2>

              <p className="section__text">
                Мы не используем искусственные KPI, проценты экономии и
                “успешный успех”. Для инженерного B2B важнее честно показать
                задачу, что было реализовано и какой результат получил объект.
              </p>
            </div>

            <div className="cases-page__list">
              {caseItems.map((item) => (
                <article className="case-detail-card" key={item.type}>
                  <div className="case-detail-card__head">
                    <span>Тип решения</span>
                    <h3>{item.type}</h3>
                  </div>

                  <div className="case-detail-card__content">
                    <div>
                      <h4>Задача</h4>
                      <p>{item.task}</p>
                    </div>

                    <div>
                      <h4>Что реализовано</h4>
                      <p>{item.realized}</p>
                    </div>

                    <div>
                      <h4>Результат</h4>
                      <p>{item.result}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Что будет дальше</p>

              <h2 className="section__title">
                Раздел будет пополняться живыми примерами
              </h2>

              <p className="section__text">
                По мере развития направления комплексной комплектации здесь
                будут появляться реальные проекты: тип объекта, задача, состав
                решения, сроки, регион и фотографии, если их можно публиковать.
              </p>
            </div>

            <div className="page-grid">
              {futureCaseCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="process-cta">
              <div>
                <h3>Обсудим задачу вашего объекта</h3>

                <p>
                  Поможем определить, какой маршрут подходит: комплектация,
                  производственное решение или оборудование из каталога.
                </p>
              </div>

              <a
                  href="#contacts"
                  className="btn btn--primary"
                  onClick={handleContactsNavigation}
              >
                  Обсудить проект
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default CasesPage