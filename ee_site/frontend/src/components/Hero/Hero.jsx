// =========================================================
// HERO / ГЛАВНЫЙ ЭКРАН
// Первый экран сайта: позиционирование, CTA, факты и изображение.
// =========================================================

function Hero({ image }) {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__content">
          <div className="eyebrow">Производство инженерных систем</div>

          <h1>
            Создаём инженерные системы для объектов, где важны надёжность,
            сроки и результат
          </h1>

          <p className="hero__text">
            Энергоэффект проектирует и производит БТП, БМК, ВНС, ПНС и
            комплексные решения для теплоснабжения, водоснабжения и инженерной
            инфраструктуры.
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#contacts">
              Обсудить проект
            </a>
            <a className="button button--secondary" href="#products">
              Смотреть направления
            </a>
          </div>

          <div className="hero__facts">
            <div>
              <strong>БТП / БМК</strong>
              <span>проектирование и производство</span>
            </div>
            <div>
              <strong>ВНС / ПНС</strong>
              <span>инженерные решения под объект</span>
            </div>
            <div>
              <strong>B2B</strong>
              <span>работа с проектами и комплектацией</span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <img src={image} alt="Инженерное оборудование Энергоэффект" />
        </div>
      </div>
    </section>
  );
}

export default Hero;