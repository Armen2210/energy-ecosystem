// =====================================================
// EcosystemSection сайта ТД «Энергоэффект»
//
// Блок показывает соседние направления экосистемы:
// - производственные решения;
// - оборудование и комплектующие.
//
// Данные карточек вынесены в src/data/ecosystemSolutions.js.
// =====================================================

import { Link } from "react-router-dom"

import { ecosystemSolutions } from "../../data/ecosystemSolutions"

function EcosystemSection() {
  return (
    <section className="ecosystem section">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерная экосистема</p>

          <h2 className="section__title">
            Решения внутри экосистемы Энергоэффект
          </h2>

          <p className="section__text">
            Производственные решения и инженерное оборудование для объектов
            различной сложности внутри экосистемы Энергоэффект.
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