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
          <Link to="/about">О компании</Link>

          {navigation.map((item) => (
            <a href={item.url} key={item.title}>
              {item.title}
            </a>
          ))}
        </nav>

        <div className="footer__ecosystem">
          <div className="footer__title">Экосистема</div>

          <a
              href="/"
              onClick={(event) => {
                event.preventDefault();

                window.history.replaceState(null, "", "/");

                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: "smooth",
                });
              }}
            >
              Энергоэффект — производственные решения
          </a>

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