const directions = [
  "Насосное оборудование",
  "КИПиА",
  "Трубопроводная арматура",
  "Теплообменное оборудование",
  "Автоматика",
  "Комплектующие",
]

function DirectionsBlock() {
  return (
    <section className="section section--muted">
      <div className="container">
        <h2 className="section__title">Направления поставки</h2>

        <div className="direction-grid">
          {directions.map((item) => (
            <div className="direction-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DirectionsBlock