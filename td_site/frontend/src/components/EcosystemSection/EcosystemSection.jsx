function EcosystemSection() {
  return (
    <section className="ecosystem section">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерная экосистема</p>

          <h2 className="section__title">
            Решения внутри экосистемы Энергоэффект
          </h2>

          <p className="section__text">
            Производственные решения и инженерное оборудование для объектов
            различной сложности внутри экосистемы Энергоэффект.
          </p>
        </div>

        <div className="ecosystem__grid">
          <a href="/supply" className="ecosystem-card">
            <span className="ecosystem-card__label">
              Производственные решения
            </span>

            <h3>БМК, БТП, ЦТП, ВНС и другие инженерные изделия</h3>

            <p>
              Собственное производственное направление экосистемы для задач
              теплоснабжения, водоснабжения и инженерной инфраструктуры.
            </p>

            <span className="ecosystem-card__cta">
              Перейти к решениям
            </span>
          </a>

          <a
            href="https://teplouchet.com/"
            className="ecosystem-card"
            target="_blank"
            rel="noreferrer"
          >
            <span className="ecosystem-card__label">
              Оборудование и комплектующие
            </span>

            <h3>Насосы, КИПиА, арматура и инженерное оборудование</h3>

            <p>
              Каталог оборудования и комплектующих для инженерных объектов,
              эксплуатации, ремонта и модернизации.
            </p>

            <span className="ecosystem-card__cta">
              Перейти в каталог
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default EcosystemSection