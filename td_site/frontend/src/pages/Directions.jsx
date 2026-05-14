import { Link } from "react-router-dom"

import Header from "../components/Header"
import Seo from "../components/Seo"

function Directions() {
  return (
    <>
      <Seo
          title="Инженерные направления — ТД Энергоэффект"
          description="Инженерные направления для комплектации объектов: насосное оборудование, КИПиА, арматура, автоматика, теплообменное оборудование и комплектующие."
          path="/directions"
      />
      <Header />

      <main className="page directions-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Направления</p>

            <h1 className="page__title">
              Инженерные направления для комплектации объектов
            </h1>

            <p className="page__text">
              Работаем с направлениями инженерного оборудования не как с
              витриной товаров, а как с частью задачи объекта: подбираем
              решения под проект, эксплуатацию, модернизацию и сроки поставки.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Зоны комплектации</p>

              <h2 className="section__title">
                Что может входить в задачу объекта
              </h2>

              <p className="section__text">
                Состав поставки зависит от проекта. Можно обратиться с готовой
                спецификацией, описанием задачи или запросом на подбор
                возможных решений.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>Насосное оборудование</h3>

                <p>
                  Подбор насосов, насосных групп и комплектующих для систем
                  отопления, водоснабжения, пожаротушения и технологических
                  задач.
                </p>
              </article>

              <article className="info-card">
                <h3>КИПиА</h3>

                <p>
                  Контрольно-измерительные приборы, датчики, автоматика и
                  элементы управления для инженерных систем объекта.
                </p>
              </article>

              <article className="info-card">
                <h3>Трубопроводная арматура</h3>

                <p>
                  Запорная, регулирующая и защитная арматура под требования
                  проекта, среды, давления и условий эксплуатации.
                </p>
              </article>

              <article className="info-card">
                <h3>Теплообменное оборудование</h3>

                <p>
                  Решения для тепловых пунктов, систем отопления, ГВС и
                  инженерной инфраструктуры объекта.
                </p>
              </article>

              <article className="info-card">
                <h3>Автоматика</h3>

                <p>
                  Элементы управления инженерными системами, технологическими
                  процессами и оборудованием объекта.
                </p>
              </article>

              <article className="info-card">
                <h3>Комплектующие и материалы</h3>

                <p>
                  Дополнительные элементы, материалы и комплектующие, которые
                  могут потребоваться для реализации инженерной задачи.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Как начать</p>

              <h2 className="section__title">
                Не обязательно знать точный перечень оборудования
              </h2>

              <p className="section__text">
                Если есть проект, спецификация или только описание задачи — с
                этого уже можно начать обсуждение. Мы поможем определить
                дальнейший маршрут.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>Есть спецификация</h3>

                <p>
                  Можно отправить перечень оборудования, материалов или
                  комплектующих для предварительного обсуждения.
                </p>
              </article>

              <article className="info-card">
                <h3>Есть задача объекта</h3>

                <p>
                  Можно описать объект, сроки, ограничения и ожидаемый результат
                  — поможем понять, что требуется.
                </p>
              </article>

              <article className="info-card">
                <h3>Нужен маршрут внутри экосистемы</h3>

                <p>
                  Если задача относится к производственным решениям или каталогу
                  оборудования, подскажем подходящее направление.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="process-cta">
              <div>
                <h3>Есть задача по инженерной комплектации?</h3>

                <p>
                  Опишите, что требуется объекту. Поможем определить, какие
                  направления и решения могут подойти.
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

export default Directions