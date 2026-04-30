import Header from "../components/Header"

function Supply() {
  return (
    <>
      <Header />

      <main className="page">
        <div className="container">

          <h1 className="page__title">
            Комплексная поставка
          </h1>

          <p className="page__text">
            Организуем комплексную поставку инженерного оборудования
            под задачи строительства, модернизации и эксплуатации объектов.
          </p>

          <div className="page-grid">

            <div className="info-card">
              <h3>Подбор оборудования</h3>

              <p>
                Помогаем подобрать оборудование под проект,
                техническое задание и требования заказчика.
              </p>
            </div>

            <div className="info-card">
              <h3>Комплектация объекта</h3>

              <p>
                Формируем поставку из нескольких направлений:
                насосное оборудование, КИПиА, автоматика,
                теплообменное оборудование и комплектующие.
              </p>
            </div>

            <div className="info-card">
              <h3>Сопровождение поставки</h3>

              <p>
                Контролируем процесс поставки,
                взаимодействуем с поставщиками и сопровождаем заказчика.
              </p>
            </div>

          </div>

          <section className="steps-section">

            <h2 className="section-title">
              Этапы работы
            </h2>

            <div className="steps-grid">

              <div className="step-card">
                <span className="step-number">1</span>

                <h3>Получаем заявку</h3>

                <p>
                  Изучаем задачу, технические требования
                  и исходные данные.
                </p>
              </div>

              <div className="step-card">
                <span className="step-number">2</span>

                <h3>Подбираем решение</h3>

                <p>
                  Формируем предложение
                  и подбираем необходимое оборудование.
                </p>
              </div>

              <div className="step-card">
                <span className="step-number">3</span>

                <h3>Организуем поставку</h3>

                <p>
                  Контролируем сроки,
                  комплектность и отгрузку оборудования.
                </p>
              </div>

            </div>

          </section>

        </div>
      </main>
    </>
  )
}

export default Supply