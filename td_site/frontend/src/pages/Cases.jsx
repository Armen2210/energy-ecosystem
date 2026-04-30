import Header from "../components/Header"

const cases = [
  {
    title: "Комплектация инженерного оборудования",
    text: "Подбор и поставка оборудования под задачи строительного объекта.",
  },
  {
    title: "Поставка оборудования для теплового пункта",
    text: "Комплектация объекта оборудованием, арматурой, КИПиА и комплектующими.",
  },
  {
    title: "Срочная поставка комплектующих",
    text: "Помощь заказчику с подбором и поставкой оборудования в сжатые сроки.",
  },
]

function Cases() {
  return (
    <>
      <Header />

      <main className="page">
        <div className="container">
          <h1 className="page__title">Кейсы</h1>

          <p className="page__text">
            Примеры задач, с которыми может работать ТД Энергоэффект.
          </p>

          <div className="page-grid">
            {cases.map((item) => (
              <div className="info-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default Cases