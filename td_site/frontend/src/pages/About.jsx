import Header from "../components/Header"

function About() {
  return (
    <>
      <Header />

      <main className="page">
        <div className="container">
          <h1 className="page__title">О компании</h1>

          <p className="page__text">
            ООО «ТД Энергоэффект» занимается комплексной поставкой инженерного оборудования
            для объектов строительства, эксплуатации и модернизации.
          </p>

          <div className="page-grid">
            <div className="info-card">
              <h3>Что мы делаем</h3>
              <p>
                Подбираем оборудование под задачу заказчика, комплектуем объекты
                и сопровождаем поставку от заявки до результата.
              </p>
            </div>

            <div className="info-card">
              <h3>Для кого работаем</h3>
              <p>
                Для строительных компаний, проектировщиков, подрядчиков,
                эксплуатирующих организаций и промышленных заказчиков.
              </p>
            </div>

            <div className="info-card">
              <h3>Наша роль</h3>
              <p>
                Быть надежной точкой входа в экосистему Энергоэффект
                по вопросам комплексной поставки инженерного оборудования.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default About