// =========================================================
// HEADER / ШАПКА САЙТА
// Логотип, основная навигация и телефон.
// Навигация приходит из src/data/navigation.js.
// =========================================================

function Header({ navigation }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <div className="logo">
          <div className="logo__mark">ЭЭ</div>

          <div>
            <div className="logo__title">Энергоэффект</div>
            <div className="logo__subtitle">
              Инженерная производственная платформа
            </div>
          </div>
        </div>

        <nav className="nav">
          {navigation.map((item) => (
            <a href={item.url} key={item.title}>
              {item.title}
            </a>
          ))}
        </nav>

        <a className="header__phone" href="tel:+79381693109">
          +7 (938) 169-31-09
        </a>
      </div>
    </header>
  );
}

export default Header;