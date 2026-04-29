const steps = [
  "Получаем задачу",
  "Анализируем объект",
  "Подбираем оборудование",
  "Готовим КП",
  "Организуем поставку",
  "Сопровождаем клиента",
]

function WorkSteps() {
  return (
    <section className="steps">
      <div className="container">
        <h2 className="section__title">Как мы работаем</h2>

        <div className="steps__grid">
          {steps.map((step, index) => (
            <div className="step-card" key={step}>
              <div className="step-card__number">
                {index + 1}
              </div>

              <h3>{step}</h3>

              <p>
                Этап работы с заявкой и подготовкой поставки под объект.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkSteps