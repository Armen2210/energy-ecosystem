import Header from "../components/Header"

function Directions() {
  return (
    <>
      <Header />

      <main className="page">
        <div className="container">
          <h1 className="page__title">Направления поставки</h1>

          <p className="page__text">
            Работаем с основными категориями инженерного оборудования для объектов строительства,
            эксплуатации и модернизации.
          </p>

          <div className="page-grid">
            <div className="info-card">
              <h3>Насосное оборудование</h3>
              <p>Подбор и поставка насосов, насосных групп и комплектующих.</p>
            </div>

            <div className="info-card">
              <h3>КИПиА</h3>
              <p>Контрольно-измерительные приборы, датчики, автоматика и элементы управления.</p>
            </div>

            <div className="info-card">
              <h3>Трубопроводная арматура</h3>
              <p>Запорная, регулирующая и защитная арматура для инженерных систем.</p>
            </div>

            <div className="info-card">
              <h3>Теплообменное оборудование</h3>
              <p>Оборудование для тепловых пунктов, систем отопления и ГВС.</p>
            </div>

            <div className="info-card">
              <h3>Автоматика</h3>
              <p>Решения для управления инженерными системами и технологическими процессами.</p>
            </div>

            <div className="info-card">
              <h3>Комплектующие</h3>
              <p>Дополнительные элементы для комплектации объектов и оборудования.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Directions