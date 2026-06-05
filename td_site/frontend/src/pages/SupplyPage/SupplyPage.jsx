// =====================================================
// SupplyPage сайта ТД «Энергоэффект»
//
// Страница комплектации инженерных объектов.
//
// Задачи страницы:
// - объяснить роль ТД в комплектации объектов;
// - показать, с какими задачами можно обратиться;
// - объяснить процесс работы;
// - направить пользователя к заявке.
//
// Данные карточек вынесены в src/data/supply.js.
// =====================================================

import { useNavigate } from "react-router-dom"

import Header from "../../components/Header"
import Seo from "../../components/Seo"

import { supplyProcessSteps, supplyTopics } from "../../data/supply"

function SupplyPage() {
  const navigate = useNavigate()

  // =====================================================
  // Переход к форме заявки на главной странице
  //
  // Страница /supply пока существует как отдельный маршрут,
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
        title="Комплектация объектов — ТД Энергоэффект"
        description="Комплектация инженерных объектов под задачу проекта: подбор оборудования, материалов, аналогов и организация поставки."
        path="/supply"
      />

      <Header />

      <main className="page supply-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Комплектация объектов</p>

            <h1 className="page__title">
              Помогаем организовать поставку под задачу инженерного объекта
            </h1>

            <p className="page__text">
              Работаем не как каталог “всего подряд”, а как инженерный маршрут:
              уточняем задачу, подбираем оборудование, ищем возможные аналоги и
              помогаем выстроить поставку под требования проекта.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Что можно обсудить</p>

              <h2 className="section__title">
                Комплектация под требования объекта
              </h2>

              <p className="section__text">
                Направление развивается как гибкий формат работы с проектами:
                состав поставки зависит от задачи объекта, исходных данных,
                сроков и доступности оборудования.
              </p>
            </div>

            <div className="page-grid">
              {supplyTopics.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Процесс</p>

              <h2 className="section__title">
                Как строится работа по комплектации
              </h2>

              <p className="section__text">
                Сначала разбираемся в задаче, затем подбираем решение и
                определяем дальнейшие шаги по поставке.
              </p>
            </div>

            <div className="page-grid">
              {supplyProcessSteps.map((item) => (
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
                <h3>Есть задача по комплектации объекта?</h3>

                <p>
                  Опишите задачу, приложите спецификацию или проект — обсудим,
                  какой путь решения подходит вашему объекту.
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

export default SupplyPage