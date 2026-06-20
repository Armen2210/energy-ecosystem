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
        <div>
          <div className="footer__brand">Энергоэффект</div>
          <p>
            Инженерная производственная платформа: БМК, БТП, ВНС, ПНС,
            шкафы управления и услуги для инженерных объектов.
          </p>

          <div className="footer__legal">
              <span>© ООО «Энергоэффект»</span>
              <span>ИНН: 6161070112</span>
              <Link to="/privacy" state={{ entryScroll: "top-smooth" }}>
                Политика обработки персональных данных
              </Link>
          </div>
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

          <Link to="/privacy" state={{ entryScroll: "top-smooth" }}>
            Политика
          </Link>
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

          <a
            href="https://teplouchet.com/"
            target="_blank"
            rel="noreferrer"
          >
            Теплоучет — оборудование и комплектующие
          </a>
        </div>

        <div className="footer__contacts">
          <a href="tel:+79381693109">+78004440766</a>
          <a href="mailto:sales@ee-don.ru">sales@ee-don.ru</a>
          <span>
            Заявки на производство, проектирование, строительно-монтажные работы
            и пусконаладку
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;