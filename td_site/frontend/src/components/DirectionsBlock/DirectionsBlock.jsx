import { Link } from "react-router-dom"

function DirectionsBlock() {
  return (
    <section className="routing section section--muted">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Маршрут внутри экосистемы</p>

          <h2 className="section__title">
            Что требуется вашему объекту?
          </h2>

          <p className="section__text">
            Поможем подобрать оптимальное решение внутри инженерной экосистемы
            Энергоэффект.
          </p>
        </div>

        <div className="routing__grid">
          <Link to="/contacts" className="routing-card routing-card--main">
            <span className="routing-card__label">Основной сценарий</span>

            <h3>Комплектация объектов</h3>

            <p>
              Подбор и поставка оборудования и материалов под задачи
              инженерного проекта.
            </p>

            <span className="routing-card__cta">
              Обсудить проект
            </span>
          </Link>

          <Link to="/supply" className="routing-card">
            <span className="routing-card__label">Производство</span>

            <h3>Производственные решения</h3>

            <p>
              БМК, БТП, ЦТП, ВНС и другие инженерные изделия собственного
              производства.
            </p>

            <span className="routing-card__cta">
              Перейти к решениям
            </span>
          </Link>

          <a
            href="https://teplouchet.com/"
            className="routing-card"
            target="_blank"
            rel="noreferrer"
          >
            <span className="routing-card__label">Оборудование</span>

            <h3>Оборудование и комплектующие</h3>

            <p>
              Насосы, КИПиА, арматура и инженерное оборудование для объектов
              различной сложности.
            </p>

            <span className="routing-card__cta">
              Перейти в каталог
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default DirectionsBlock