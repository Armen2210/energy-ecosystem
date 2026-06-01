// =====================================================
// WorkSteps сайта ТД «Энергоэффект»
//
// Блок показывает этапы работы над задачей клиента:
// - получение задачи;
// - подбор решения;
// - организация поставки;
// - сопровождение.
//
// Данные этапов вынесены в src/data/workSteps.js,
// чтобы компонент не содержал хардкод.
// =====================================================

import { Link } from "react-router-dom"

import { workSteps } from "../../data/workSteps"

function WorkSteps() {
  return (
    <section className="process section section--muted">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Процесс работы</p>

          <h2 className="section__title">
            Как строится работа над проектом
          </h2>

          <p className="section__text">
            Выстраиваем процесс от задачи объекта до поставки оборудования и
            инженерных решений.
          </p>
        </div>

        <div className="process__grid">
          {workSteps.map((step, index) => (
            <article className="process-card" key={step.title}>
              <span className="process-card__step">
                Шаг {index + 1}
              </span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>
            </article>
          ))}
        </div>

        <div className="process-cta">
          <div>
            <h3>Обсудим задачу вашего объекта</h3>

            <p>
              Поможем подобрать инженерное решение и выстроить дальнейшую работу
              по проекту.
            </p>
          </div>

          <Link to="/contacts" className="btn btn--primary">
            Обсудить проект
          </Link>
        </div>
      </div>
    </section>
  )
}

export default WorkSteps