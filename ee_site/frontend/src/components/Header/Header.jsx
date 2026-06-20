// =========================================================
// HEADER / ШАПКА САЙТА
// Логотип, основная навигация и телефон.
// Навигация приходит из src/data/navigation.js.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import energyLogo from "../../assets/energoeffect-logo-orange.svg";

function Header({ navigation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const [isLogoLeaving, setIsLogoLeaving] = useState(false);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleLogoClick(event) {
      event.preventDefault();

      setIsLogoLeaving(true);

      timerRef.current = setTimeout(() => {
        setIsLogoLeaving(false);

        const currentPath = location.pathname.replace(/\/$/, "") || "/";

        if (currentPath === "/") {
          window.history.replaceState(null, "", "/");

          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
          });

          return;
        }

        if (currentPath.startsWith("/solutions")) {
          navigate("/", {
            state: { entryScroll: "products-then-top" },
          });

          return;
        }

        if (currentPath.startsWith("/services")) {
          navigate("/", {
            state: { entryScroll: "services-then-top" },
          });

          return;
        }

        navigate("/", {
          state: { entryScroll: "contacts-then-top" },
        });
      }, 140);
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <a
          className={`logo ${isLogoLeaving ? "logo--leaving" : ""}`}
          href="/"
          onClick={handleLogoClick}
          aria-label="Энергоэффект — перейти на главную страницу"
        >
          <img
            className="logo__image"
            src={energyLogo}
            alt="Энергоэффект"
          />
        </a>

        <nav className="nav">
          {navigation.map((item) => (
              <Link to={item.url} key={item.title}>
                {item.title}
              </Link>
          ))}
        </nav>

        <a className="header__phone" href="tel:+79381693109">
          +78004440766
        </a>
      </div>
    </header>
  );
}

export default Header;