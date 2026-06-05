// =====================================================
// Hero сайта ТД «Энергоэффект»
//
// Первый экран главной страницы.
//
// Задачи:
// - быстро объяснить роль ТД;
// - показать, что ТД комплектует инженерные объекты;
// - дать основной CTA к форме заявки;
// - дать быстрый контакт через телефон.
//
// Важно:
// компонент вынесен из HomePage.jsx, чтобы главная страница
// оставалась сборщиком секций, как в архитектуре сайта ЭЭ.
// =====================================================

import heroImage from "../../assets/hero.png"

function Hero() {
  // =====================================================
  // Скролл к форме заявки
  //
  // Используем JS-скролл вместо обычного href="#contacts",
  // чтобы поведение было стабильнее внутри React SPA.
  // =====================================================
  const scrollToContacts = (event) => {
    event.preventDefault()

    const contactsSection = document.getElementById("contacts")

    if (!contactsSection) {
      return
    }

    contactsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__content">
            <p className="hero__label">
              Инженерная экосистема Энергоэффект
            </p>

            <h1 className="hero__title">
              Комплектуем инженерные объекты под задачи проекта
            </h1>

            <p className="hero__text">
              Помогаем подобрать оборудование, организовать поставку и найти
              оптимальное решение для инженерных объектов различной сложности.
            </p>

            <div className="hero__actions">
              <a
                href="#contacts"
                className="btn btn--primary"
                onClick={scrollToContacts}
              >
                Обсудить проект
              </a>

              <a href="tel:+79381246802" className="btn btn--secondary">
                Позвонить менеджеру
              </a>
            </div>

            <p className="hero__trust">
              Комплектация • Производство • Инженерные решения
            </p>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero