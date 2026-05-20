// =========================================================
// HEADER / ШАПКА САЙТА
// Логотип, основная навигация и телефон.
// Навигация приходит из src/data/navigation.js.
// =========================================================

import { useNavigate } from "react-router-dom";

function Header({ navigation }) {
  const navigate = useNavigate();

  function handleLogoClick(event) {
    event.preventDefault();

    const isHomePage = window.location.pathname === "/";

    if (isHomePage) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      window.history.replaceState(null, "", "/");

      return;
    }

    setTimeout(() => {
      navigate("/#summary");
    }, 120);
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <a className="logo" href="/#summary" onClick={handleLogoClick}>
          <div className="logo__mark">ЭЭ</div>

          <div>
            <div className="logo__title">Энергоэффект</div>
            <div className="logo__subtitle">
              Инженерная производственная платформа
            </div>
          </div>
        </a>

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