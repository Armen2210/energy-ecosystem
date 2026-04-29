import Header from "../components/Header"
import DirectionsBlock from "../components/DirectionsBlock"
import WorkSteps from "../components/WorkSteps"
import LeadForm from "../components/LeadForm"

function Home() {
  return (
    <>
      <Header />

      <main className="hero">
        <div className="container">
          <div className="hero__content">

            <h1 className="hero__title">
              Комплексные поставки
              инженерного оборудования
              под ваш объект
            </h1>

            <p className="hero__text">
              Подбираем оборудование,
              комплектуем объекты
              и сопровождаем поставку
              от заявки до результата.
            </p>

            <div className="hero__actions">
              <button className="btn btn--primary">
                Получить предложение
              </button>

              <button className="btn btn--secondary">
                Посмотреть направления
              </button>
            </div>

          </div>
        </div>
      </main>
      <section className="section">
  <div className="container">
    <h2 className="section__title">С чем можем помочь</h2>


    <div className="cards">
      <div className="card">
        <h3>Нужна комплексная поставка</h3>
        <p>Подберем оборудование под объект и подготовим предложение.</p>
      </div>

      <div className="card">
        <h3>Нужен расчет БТП / БМК / ВНС / ПНС</h3>
        <p>Передадим запрос в профильное направление экосистемы.</p>
      </div>

      <div className="card">
        <h3>Нужно купить оборудование</h3>
        <p>Направим в интернет-магазин Теплоучет.</p>
      </div>
    </div>
  </div>
</section>

<DirectionsBlock />

<WorkSteps />
<LeadForm />

    </>
  )
}

export default Home