// =====================================================
// Footer сайта ТД «Энергоэффект»
//
// Задачи Footer:
// - дать короткое позиционирование ТД;
// - показать навигацию;
// - показать связь с экосистемой;
// - оставить контакты и юридическую ссылку.
//
// Footer сделан компактнее, чтобы не перегружать страницу.
// Навигация берётся из src/data/navigation.js.
// =====================================================

import { Link } from "react-router-dom"

import { mainNavigation, serviceNavigation } from "../../data/navigation"

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <h3>ТД Энергоэффект</h3>

            <p>
              Комплектация инженерных объектов, подбор оборудования и
              сопровождение поставок для строительных и производственных задач.
            </p>

            <div className="footer__legal">
              <span>© 2026 ТД Энергоэффект</span>

              {serviceNavigation.map((item) => (
                <Link key={item.path} to={item.path}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <nav className="footer__column" aria-label="Навигация в подвале">
            <h4>Навигация</h4>

            {mainNavigation.map((item) => (
              <Link key={item.path} to={item.path}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="footer__column">
            <h4>Экосистема</h4>

            <span>ТД Энергоэффект — комплектация инженерных объектов</span>
            <span>Энергоэффект — производственные решения</span>

            <a
              href="https://teplouchet.com/"
              target="_blank"
              rel="noreferrer"
            >
              Теплоучет — оборудование и комплектующие
            </a>
          </div>

          <div className="footer__column footer__contacts">
            <h4>Контакты</h4>

            <a href="tel:+79381246802">+7 (938) 124-68-02</a>
            <a href="mailto:salestd@ee-don.ru">salestd@ee-don.ru</a>
            <span>Ростов-на-Дону</span>

            <Link to="/contacts" className="footer__cta">
              Обсудить проект
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer