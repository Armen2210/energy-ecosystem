// =========================================================
// FOOTER / ПОДВАЛ САЙТА
// Нижний блок сайта: краткое позиционирование, навигация,
// экосистема компаний и контакты.
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



          <Link
            to="/"
            state={{ entryScroll: "top-smooth" }}
          >
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
          <a href="tel:+79381693109">+7 (938) 169-31-09</a>
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