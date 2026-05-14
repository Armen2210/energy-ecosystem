import { Link } from "react-router-dom"

import Header from "../components/Header"
import Seo from "../components/Seo"

const cases = [
  {
    type: "Блочный тепловой пункт",
    task: "Производство и комплектация инженерного решения под требования объекта.",
    realized:
      "Подготовлено инженерное решение, подобран состав оборудования и обеспечена комплектация под требования проекта.",
    result:
      "Решение реализуется с учетом особенностей объекта, проектных требований и сроков поставки.",
  },
  {
    type: "Блочно-модульная котельная",
    task: "Подготовка производственного решения для теплоснабжения объекта.",
    realized:
      "Производственное направление экосистемы разрабатывает и комплектует инженерное изделие под задачу объекта.",
    result:
      "Клиент получает не отдельный набор оборудования, а готовое инженерное решение внутри экосистемы.",
  },
  {
    type: "Комплектация инженерного объекта",
    task: "Подбор оборудования, материалов и комплектующих под задачу проекта.",
    realized:
      "ТД Энергоэффект помогает определить состав поставки, возможные аналоги и дальнейший маршрут взаимодействия.",
    result:
      "Задача объекта переводится в понятный процесс: обсуждение, подбор, комплектация и поставка.",
  },
]

function Cases() {
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
              {cases.map((item) => (
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
              <article className="info-card">
                <h3>Тип объекта</h3>
                <p>
                  Будем показывать, для какого объекта решалась задача:
                  строительство, эксплуатация, модернизация или инженерная
                  инфраструктура.
                </p>
              </article>

              <article className="info-card">
                <h3>Состав решения</h3>
                <p>
                  Будем раскрывать, какие направления участвовали: комплектация,
                  производство, оборудование, КИПиА, насосы, арматура и другие
                  элементы.
                </p>
              </article>

              <article className="info-card">
                <h3>Подтверждение реальности</h3>
                <p>
                  При наличии разрешения можно будет добавлять фотографии,
                  регион, сроки и описание выполненной задачи без раскрытия
                  коммерческой тайны.
                </p>
              </article>
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

export default Cases