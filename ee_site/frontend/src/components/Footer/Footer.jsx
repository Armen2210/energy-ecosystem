// =========================================================
// FOOTER / ПОДВАЛ САЙТА
// Нижний блок сайта: краткое позиционирование, навигация,
// контакты и связь с экосистемой.
// =========================================================

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
          {navigation.map((item) => (
            <a href={item.url} key={item.title}>
              {item.title}
            </a>
          ))}
        </nav>

        <div className="footer__contacts">
          <a href="tel:+79381693109">+7 (938) 169-31-09</a>
          <span>
              Заявки на производство, проектирование, строительно-монтажные работы и пусконаладку
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;