// =========================================================
// FOOTER / ПОДВАЛ САЙТА
// Нижний блок сайта: краткое позиционирование, навигация,
// экосистема компаний, контакты и юридические ссылки.
// =========================================================

import { Link } from "react-router-dom";

function Footer({ navigation }) {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <div className="footer__brand">Энергоэффект</div>
          <p>
            Более 12 лет производим котельные, тепловые пункты,
            насосные станции и шкафы управления.
          </p>
        </div>

        <nav className="footer__nav">
          <Link to="/about" state={{ entryScroll: "top-smooth" }}>
            О компании
          </Link>

          {navigation.map((item) => (
            <Link to={item.url} key={item.title}>
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="footer__ecosystem">
          <div className="footer__title">Экосистема</div>

          <Link to="/" state={{ entryScroll: "top-smooth" }}>
            Энергоэффект — производственные решения
          </Link>

          <a
            href="https://td-energoeffect.ru/"
            target="_blank"
            rel="noreferrer"
          >
            ТД Энергоэффект — комплектация инженерных объектов
          </a>
        </div>

        <div className="footer__contacts">
          <a href="tel:+78004440766">+7 800 444-07-66</a>
          <a href="mailto:sales@ee-don.ru">sales@ee-don.ru</a>
        </div>

        <div className="footer__legal">
          <span>© ООО «Энергоэффект»</span>
          <span>ИНН: 6161070112</span>
          <Link to="/privacy" state={{ entryScroll: "top-smooth" }}>
            Политика обработки персональных данных
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;