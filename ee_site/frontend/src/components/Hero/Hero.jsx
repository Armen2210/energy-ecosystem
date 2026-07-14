// =========================================================
// HERO / ГЛАВНЫЙ ЭКРАН
// Первый экран сайта: позиционирование, CTA и изображение.
// ЭЭ-5.1: убраны дублирующие hero-facts, структура упрощена.
// =========================================================

function Hero({ image }) {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__content">
          <h1>
            Завод современного инженерного оборудования
          </h1>

          <p className="hero__text">
            Более 12 лет проектируем и производим блочные котельные, тепловые пункты,
             насосные станции, шкафы управления и автоматизации

          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#contacts">
              Обсудить проект
            </a>
            <a className="button button--secondary" href="#products">
              Смотреть направления
            </a>
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