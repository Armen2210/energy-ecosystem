import Header from "../components/Header"
import LeadForm from "../components/LeadForm"

function Contacts() {
  return (
    <>
      <Header />

      <main className="page">
        <div className="container">

          <h1 className="page__title">
            Контакты
          </h1>

          <p className="page__text">
            Свяжитесь с ТД Энергоэффект для обсуждения проекта,
            подбора оборудования и получения коммерческого предложения.
          </p>

          <div className="contacts-grid">

            <div className="info-card">
              <h3>Email</h3>

              <p>
                info@energyeffect.ru
              </p>
            </div>

            <div className="info-card">
              <h3>Телефон</h3>

              <p>
                +7 (999) 999-99-99
              </p>
            </div>

            <div className="info-card">
              <h3>Направление работы</h3>

              <p>
                Комплексные поставки инженерного оборудования
                для объектов строительства и эксплуатации.
              </p>
            </div>

          </div>

          <LeadForm />

        </div>
      </main>
    </>
  )
}

export default Contacts