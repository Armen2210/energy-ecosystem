import Header from "../components/Header"
import Seo from "../components/Seo"
import LeadForm from "../components/LeadForm"

function Contacts() {
  return (
    <>
      <Seo
          title="Контакты — ТД Энергоэффект"
          description="Контакты ТД Энергоэффект: обсудить комплектацию инженерного объекта, подбор оборудования, проект или спецификацию."
          path="/contacts"
      />
      <Header />

      <main className="page contacts-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Контакты</p>

            <h1 className="page__title">
              Обсудим задачу вашего объекта
            </h1>

            <p className="page__text">
              Свяжитесь с ТД Энергоэффект, чтобы обсудить комплектацию объекта,
              подбор оборудования, производственное решение или дальнейший
              маршрут внутри инженерной экосистемы.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Как начать</p>

              <h2 className="section__title">
                Достаточно описать задачу
              </h2>

              <p className="section__text">
                Можно обратиться с проектом, спецификацией, перечнем
                оборудования или предварительным описанием объекта.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>Телефон</h3>

                <p>
                  +7 (938) 124-68-02
                </p>
              </article>

              <article className="info-card">
                <h3>Email</h3>

                <p>
                  salestd@ee-don.ru
                </p>
              </article>

              <article className="info-card">
                <h3>Город</h3>

                <p>
                  Ростов-на-Дону
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Что можно отправить</p>

              <h2 className="section__title">
                Чем больше исходных данных, тем точнее маршрут
              </h2>

              <p className="section__text">
                Но даже если полного проекта пока нет, можно начать с краткого
                описания задачи.
              </p>
            </div>

            <div className="page-grid">
              <article className="info-card">
                <h3>Проект или спецификация</h3>

                <p>
                  Можно приложить проектную документацию, спецификацию или
                  перечень оборудования для предварительного обсуждения.
                </p>
              </article>

              <article className="info-card">
                <h3>Описание объекта</h3>

                <p>
                  Укажите тип объекта, задачу, сроки, ограничения и что нужно
                  получить в результате.
                </p>
              </article>

              <article className="info-card">
                <h3>Предварительный запрос</h3>

                <p>
                  Если точный состав оборудования и материалов пока неизвестен, опишите
                  задачу — поможем определить дальнейшие шаги.
                </p>
              </article>
            </div>
          </div>
        </section>

        <LeadForm />
      </main>
    </>
  )
}

export default Contacts