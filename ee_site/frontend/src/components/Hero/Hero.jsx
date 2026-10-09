// =========================================================
// HERO / ГЛАВНЫЙ ЭКРАН
// Первый экран сайта: позиционирование, CTA и изображение.
// ЭЭ-5.1: убраны дублирующие hero-facts, структура упрощена.
// =========================================================

function Hero({ image, imageSmall, imageMedium }) {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__content">
          <h1>
            <span className="hero__title-accent">ЗАВОД</span>
            <span>Современного</span>
            <span>инженерного оборудования</span>
          </h1>

          <p className="hero__text">
            Более 12 лет проектируем и производим инженерное оборудование
            под задачи конкретного объекта — от проекта до готового решения.

          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#contacts" data-analytics-cta="hero">
              Обсудить проект
            </a>

            <a
              className="button button--secondary hero__button--services"
              href="#services"
            >
              Смотреть наши услуги
            </a>

            <a
              className="button button--secondary hero__button--products"
              href="#products"
            >
              Смотреть нашу продукцию
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <img src={image} width="1554" height="1012"
            srcSet={`${imageSmall} 480w, ${imageMedium} 780w, ${image} 1554w`}
            sizes="(min-width: 961px) 50vw, calc(100vw - 32px)"
            alt="Инженерное оборудование Энергоэффект" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
