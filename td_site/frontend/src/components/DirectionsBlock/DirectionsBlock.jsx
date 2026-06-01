// =====================================================
// DirectionsBlock сайта ТД «Энергоэффект»
//
// Блок маршрутизации внутри экосистемы.
// Помогает пользователю выбрать правильный контур:
// - ТД Энергоэффект;
// - Энергоэффект;
// - Теплоучет.
//
// Данные карточек вынесены в src/data/ecosystemRoutes.js,
// чтобы компонент не содержал хардкод.
// =====================================================

import { Link } from "react-router-dom"

import { ecosystemRoutes } from "../../data/ecosystemRoutes"

function DirectionsBlock() {
  return (
    <section className="routing section section--muted">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Маршрут внутри экосистемы</p>

          <h2 className="section__title">Что требуется вашему объекту?</h2>

          <p className="section__text">
            Поможем подобрать оптимальное решение внутри инженерной экосистемы
            Энергоэффект.
          </p>
        </div>

        <div className="routing__grid">
          {ecosystemRoutes.map((item) => {
            const cardClassName = item.isMain
              ? "routing-card routing-card--main"
              : "routing-card"

            if (item.isExternal) {
              return (
                <a
                  key={item.title}
                  href={item.path}
                  className={cardClassName}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="routing-card__label">{item.label}</span>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>

                  <span className="routing-card__cta">{item.cta}</span>
                </a>
              )
            }

            return (
              <Link key={item.title} to={item.path} className={cardClassName}>
                <span className="routing-card__label">{item.label}</span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <span className="routing-card__cta">{item.cta}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default DirectionsBlock