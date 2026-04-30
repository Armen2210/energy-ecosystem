function Footer() {
  return (
    <footer className="footer">

      <div className="container">

        <div className="footer__top">

          <div className="footer__brand">
            <h3>ТД Энергоэффект</h3>

            <p>
              Комплексные поставки инженерного
              оборудования для объектов строительства,
              модернизации и эксплуатации.
            </p>
          </div>

          <div className="footer__nav">

            <div>
              <h4>Навигация</h4>

              <a href="/">Главная</a>
              <a href="/about">О компании</a>
              <a href="/supply">Поставка</a>
            </div>

            <div>
              <h4>Направления</h4>

              <a href="/directions">КИПиА</a>
              <a href="/directions">Насосное оборудование</a>
              <a href="/directions">Автоматика</a>
            </div>

            <div>
              <h4>Контакты</h4>

              <p>info@energyeffect.ru</p>
              <p>+7 (999) 999-99-99</p>
            </div>

          </div>

        </div>

        <div className="footer__bottom">
          © 2026 ТД Энергоэффект
        </div>

      </div>

    </footer>
  )
}

export default Footer