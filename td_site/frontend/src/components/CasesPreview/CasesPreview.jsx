// =====================================================
// CasesPreview сайта ТД «Энергоэффект»
//
// Блок превью инженерных решений и кейсов.
// Данные вынесены в src/data/casesPreview.js,
// чтобы компонент отвечал только за отображение.
// =====================================================

import { Link } from "react-router-dom"

import { casesPreview } from "../../data/casesPreview"

function CasesPreview() {
  return (
    <section className="cases-preview section">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерные решения</p>

          <h2 className="section__title">
            Реализованные инженерные решения
          </h2>

          <p className="section__text">
            Производственные и инженерные решения, реализуемые внутри экосистемы
            Энергоэффект. По мере появления новых проектов раздел будет
            дополняться живыми примерами.
          </p>
        </div>

        <div className="cases-preview__grid">
          {casesPreview.map((item) => (
            <article className="case-preview-card" key={item.type}>
              <span className="case-preview-card__type">
                {item.type}
              </span>

              <div>
                <h3>Задача</h3>
                <p>{item.task}</p>
              </div>

              <div>
                <h3>Результат</h3>
                <p>{item.result}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="cases-preview__footer">
          <p>
            Нужна комплектация объекта или производственное инженерное решение?
          </p>

          <Link to="/contacts" className="btn btn--primary">
            Обсудить проект
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CasesPreview