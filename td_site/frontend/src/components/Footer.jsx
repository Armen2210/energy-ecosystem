import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <h3>Инженерная экосистема Энергоэффект</h3>

            <p>
              Комплектация объектов, производственные решения и инженерное
              оборудование для проектов различной сложности.
            </p>

            <p className="footer__summary">
              ТД Энергоэффект помогает решать задачи комплектации инженерных
              объектов, подбора оборудования и взаимодействия внутри инженерной
              экосистемы Энергоэффект.
            </p>
          </div>

          <nav className="footer__column" aria-label="Навигация в подвале">
            <h4>Навигация</h4>

            <Link to="/directions">Направления</Link>
            <Link to="/supply">Решения</Link>
            <Link to="/cases">Кейсы</Link>
            <Link to="/about">О компании</Link>
            <Link to="/contacts">Контакты</Link>
          </nav>

          <div className="footer__column">
              <h4>Экосистема</h4>

              <Link to="/contacts">
                ТД Энергоэффект — комплектация инженерных объектов
              </Link>

              <Link to="/supply">
                Энергоэффект — производственные решения
              </Link>

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

            <a href="tel:+79381693109">+7 (938) 124-68-02</a>
            <a href="mailto:salestd@ee-don.ru">salestd@ee-don.ru</a>
            <span>Ростов-на-Дону</span>

            <Link to="/contacts" className="footer__cta">
              Обсудить проект
            </Link>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 ТД Энергоэффект</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer