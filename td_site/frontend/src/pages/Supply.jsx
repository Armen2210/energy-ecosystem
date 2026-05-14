import { Link } from "react-router-dom"

import Header from "../components/Header"

function Supply() {
  return (
    <>
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
              <article className="info-card">
                <h3>Оборудование и материалы</h3>

                <p>
                  Помогаем подобрать оборудование, материалы и комплектующие под
                  задачу проекта, спецификацию или описание объекта.
                </p>
              </article>

              <article className="info-card">
                <h3>Подбор аналогов</h3>

                <p>
                  Если исходное оборудование недоступно по срокам, бюджету или
                  поставке, можем предложить альтернативные варианты для
                  обсуждения.
                </p>
              </article>

              <article className="info-card">
                <h3>Нестандартные задачи</h3>

                <p>
                  Можно обратиться не только с готовой спецификацией, но и с
                  общей задачей: поможем понять, какой маршрут решения подходит.
                </p>
              </article>
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
              <article className="info-card">
                <h3>1. Получаем задачу</h3>

                <p>
                  Вы присылаете описание объекта, проект, спецификацию или
                  предварительный запрос.
                </p>
              </article>

              <article className="info-card">
                <h3>2. Подбираем решение</h3>

                <p>
                  Анализируем требования, состав оборудования, возможные
                  ограничения и варианты поставки.
                </p>
              </article>

              <article className="info-card">
                <h3>3. Обсуждаем поставку</h3>

                <p>
                  Помогаем определить дальнейший маршрут: комплектация,
                  производственное решение или переход к каталогу оборудования.
                </p>
              </article>
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

              <Link to="/contacts" className="btn btn--primary">
                Обсудить проект
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default Supply