import Header from "../components/Header"

function About() {
  return (
    <>
      <Header />

      <main className="page about-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">О компании</p>

            <h1 className="page__title">
              ТД Энергоэффект — точка входа в инженерную экосистему
            </h1>

            <p className="page__text">
              Помогаем заказчикам разобраться в задаче объекта, подобрать
              инженерные решения, организовать поставку и выйти на нужное
              направление внутри экосистемы Энергоэффект.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="page-grid">
              <article className="info-card">
                <h3>Не просто поставщик</h3>

                <p>
                  ТД Энергоэффект помогает не только купить оборудование, но и
                  выстроить понятный маршрут: от задачи объекта к подбору,
                  комплектации, поставке и взаимодействию с менеджером.
                </p>
              </article>

              <article className="info-card">
                <h3>Связующее звено</h3>

                <p>
                  Если задаче требуется производственное решение — БМК, БТП,
                  ЦТП, ВНС или ПНС — клиент может быть направлен в профильное
                  направление экосистемы.
                </p>
              </article>

              <article className="info-card">
                <h3>Комплектация объектов</h3>

                <p>
                  Работаем с задачами подбора оборудования, материалов,
                  комплектующих и аналогов под требования проекта, сроки и
                  особенности реализации.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Экосистема</p>

              <h2 className="section__title">
                Как устроена экосистема Энергоэффект
              </h2>

              <p className="section__text">
                У каждого направления своя роль. ТД Энергоэффект помогает
                пользователю понять, куда обратиться с конкретной задачей.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>ТД Энергоэффект</h3>

                <p>
                  Комплектация инженерных объектов, подбор оборудования,
                  организация поставок и первичное обсуждение задач проекта.
                </p>
              </article>

              <article className="info-card">
                <h3>Энергоэффект</h3>

                <p>
                  Производственные решения: блочно-модульные котельные, блочные
                  тепловые пункты, насосные станции и другие инженерные изделия.
                </p>
              </article>

              <article className="info-card">
                <h3>Теплоучет</h3>

                <p>
                  Оборудование и комплектующие: насосы, КИПиА, арматура,
                  автоматика и инженерное оборудование для объектов.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Принцип работы</p>

              <h2 className="section__title">
                Главное — понять задачу объекта
              </h2>

              <p className="section__text">
                Мы не строим сайт как каталог “всего подряд”. Для инженерных
                проектов важнее понять требования объекта, сроки, ограничения и
                подобрать реалистичный путь решения.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>Работаем от задачи</h3>

                <p>
                  Клиент может обратиться с проектом, спецификацией, описанием
                  объекта или предварительным запросом.
                </p>
              </article>

              <article className="info-card">
                <h3>Помогаем выбрать маршрут</h3>

                <p>
                  Если нужна комплектация — обсуждаем проект. Если нужно
                  производство — направляем к решениям Энергоэффект. Если нужны
                  комплектующие — в каталог Теплоучет.
                </p>
              </article>

              <article className="info-card">
                <h3>Развиваем направление</h3>

                <p>
                  Направление комплексной комплектации развивается постепенно.
                  По мере появления реализованных проектов разделы сайта будут
                  дополняться живыми примерами.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default About