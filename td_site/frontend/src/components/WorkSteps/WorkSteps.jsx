// =====================================================
// WorkSteps сайта ТД «Энергоэффект»
//
// Блок объясняет комплектацию объектов на главной странице.
//
// Задачи:
// - показать, с какими задачами можно обратиться в ТД;
// - объяснить процесс работы по комплектации;
// - заменить отдельную страницу /supply в коротком формате;
// - направить пользователя к форме заявки.
//
// Данные:
// - темы комплектации берутся из src/data/supply.js;
// - этапы работы берутся из src/data/workSteps.js.
// =====================================================

import { supplyTopics } from "../../data/supply"
import { workSteps } from "../../data/workSteps"

function WorkSteps() {
  return (
    <section className="process section section--muted" id="solutions">
      <div className="container">
        {/* =====================================================
            ЧТО МОЖНО ОБСУДИТЬ
        ===================================================== */}
        <div className="section__head">
          <p className="section__eyebrow">Решения</p>

          <h2 className="section__title">
            Комплектация под требования объекта
          </h2>

          <p className="section__text">
            Работаем не как каталог “всего подряд”, а как инженерный маршрут:
            уточняем задачу, подбираем оборудование, ищем возможные аналоги и
            помогаем выстроить поставку под требования проекта.
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

        {/* =====================================================
            ПРОЦЕСС РАБОТЫ
        ===================================================== */}
        <div className="section__head section__head--compact">
          <p className="section__eyebrow">Процесс работы</p>

          <h2 className="section__title">
            Как строится работа по комплектации
          </h2>

          <p className="section__text">
            Сначала разбираемся в задаче, затем подбираем решение и определяем
            дальнейшие шаги по поставке.
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

        {/* =====================================================
            CTA
        ===================================================== */}
        <div className="process-cta">
          <div>
            <h3>Есть задача по комплектации объекта?</h3>

            <p>
              Опишите задачу, приложите спецификацию или проект — обсудим,
              какой путь решения подходит вашему объекту.
            </p>
          </div>

          <a href="#contacts" className="btn btn--primary">
            Обсудить проект
          </a>
        </div>
      </div>
    </section>
  )
}

export default WorkSteps