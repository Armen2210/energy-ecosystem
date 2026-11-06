// =========================================================
// FOOTER / ПОДВАЛ САЙТА
// Нижний блок сайта: краткое позиционирование, навигация,
// экосистема компаний, контакты и юридические ссылки.
// =========================================================

import { Link, useLocation } from "react-router-dom";

function Footer({ navigation, onCookieSettings }) {
  const location = useLocation();
  const footerNavigation = navigation.map(item => ({...item, url: item.url === "/#products" ? "/solutions" : item.url === "/#services" ? "/services" : item.url})).flatMap(item => item.url === '/about'
    ? [item, { title: 'Документы', url: '/documents', id: 'footer-documents' }] : [item]);
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
          {footerNavigation.map((item) => (
            <Link to={item.url} key={item.title} id={item.id}
              state={item.id === 'footer-documents' && location.pathname === '/'
                ? { documentsReturnKey: location.key } : undefined}>
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
          <div className="footer__legal-links">
            <button type="button" onClick={onCookieSettings}>Настройки cookies</button>
            <Link to="/privacy" state={{ entryScroll: "top-smooth" }}>
              Политика обработки персональных данных
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
