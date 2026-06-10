// =====================================================
// EcosystemSection сайта ТД «Энергоэффект»
//
// Блок объясняет роли направлений внутри экосистемы:
// - ТД Энергоэффект;
// - Энергоэффект;
// - Теплоучет.
//
// Задача блока:
// помочь пользователю понять, куда относится его задача:
// комплектация, производство или покупка оборудования.
//
// Данные карточек вынесены в src/data/ecosystemSolutions.js.
// =====================================================

import { Link } from "react-router-dom"

import { ecosystemSolutions } from "../../data/ecosystemSolutions"

function EcosystemSection() {
  return (
    <section className="ecosystem section" id="ecosystem">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерная экосистема</p>

          <h2 className="section__title">
            Три контура для разных инженерных задач
          </h2>

          <p className="section__text">
            ТД Энергоэффект помогает определить правильный маршрут: комплектация
            объекта, производственное решение завода или подбор оборудования в
            каталоге.
          </p>
        </div>

        <div className="ecosystem__grid">
          {ecosystemSolutions.map((item) => {
            const content = (
              <>
                <span className="ecosystem-card__label">{item.label}</span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <span className="ecosystem-card__cta">{item.cta}</span>
              </>
            )

            if (item.isCurrent || !item.path) {
              return (
                <article
                  key={item.title}
                  className="ecosystem-card ecosystem-card--current"
                >
                  {content}
                </article>
              )
            }

            if (item.isExternal) {
              return (
                <a
                  key={item.title}
                  href={item.path}
                  className="ecosystem-card"
                  target="_blank"
                  rel="noreferrer"
                >
                  {content}
                </a>
              )
            }

            return (
              <Link key={item.title} to={item.path} className="ecosystem-card">
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default EcosystemSection