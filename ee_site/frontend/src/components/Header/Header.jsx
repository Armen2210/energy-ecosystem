// =========================================================
// HEADER / ШАПКА САЙТА
// Логотип, основная навигация и телефон.
// Навигация приходит из src/data/navigation.js.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import energyLogo from "../../assets/energoeffect-logo-orange.svg";
import anniversaryLogo from "../../assets/12-years.svg";

// =========================================================
// NAV HELPERS / ПОМОЩНИКИ ДЛЯ АКТИВНОГО ПУНКТА МЕНЮ
// Header должен подсвечивать:
// - пункт меню по текущему маршруту;
// - пункт меню по текущей секции главной страницы.
// =========================================================

function normalizePathname(pathname) {
  return pathname.replace(/\/$/, "") || "/";
}

function getSectionIdFromUrl(url) {
  return url.includes("#") ? url.split("#")[1] : null;
}

function getRouteActiveUrl(pathname) {
  const currentPath = normalizePathname(pathname);

  if (currentPath.startsWith("/solutions")) {
    return "/#products";
  }

  if (currentPath.startsWith("/services")) {
    return "/#services";
  }

  if (currentPath === "/cases" || currentPath.startsWith("/cases")) {
    return "/#cases";
  }

  if (currentPath === "/contacts") {
    return "/#contacts";
  }

  return null;
}

function getHomeActiveUrl(navigation) {
  const activationPoint = window.innerHeight * 0.35;

  const activeItem = navigation.find((item) => {
    const sectionId = getSectionIdFromUrl(item.url);

    if (!sectionId) {
      return false;
    }

    const section = document.getElementById(sectionId);

    if (!section) {
      return false;
    }

    const rect = section.getBoundingClientRect();

    return rect.top <= activationPoint && rect.bottom >= activationPoint;
  });

  return activeItem?.url || null;
}

function Header({ navigation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  const locationIdentity = `${location.key}:${location.pathname}${location.hash}`;
  const [leavingLocationKey, setLeavingLocationKey] = useState(null);
  const isLogoLeaving = leavingLocationKey === locationIdentity;
  const [homeActiveNavUrl, setHomeActiveNavUrl] = useState(null);
  const activeNavUrl = normalizePathname(location.pathname) === "/"
    ? homeActiveNavUrl
    : getRouteActiveUrl(location.pathname);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [locationIdentity]);

  // =========================================================
  // ACTIVE NAV / АКТИВНЫЙ ПУНКТ НАВИГАЦИИ
  // 1. На внутренних страницах активность определяется маршрутом.
  // 2. На главной странице активность определяется текущей секцией.
  // 3. Если текущая зона главной не отражена в навигации — активный
  //    пункт сбрасывается.
  // =========================================================

  useEffect(() => {
    const currentPath = normalizePathname(location.pathname);
    if (currentPath !== "/") {
      return undefined;
    }

    let frameId = null;

    const updateActiveNav = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setHomeActiveNavUrl(getHomeActiveUrl(navigation));
      });
    };

    updateActiveNav();

    window.addEventListener("scroll", updateActiveNav, { passive: true });
    window.addEventListener("resize", updateActiveNav);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", updateActiveNav);
      window.removeEventListener("resize", updateActiveNav);
    };
  }, [location.pathname, navigation]);

  function handleLogoClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(timerRef.current);

    setLeavingLocationKey(locationIdentity);

    timerRef.current = setTimeout(() => {
      setLeavingLocationKey(null);

      const currentPath = normalizePathname(location.pathname);

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
          <span className="logo__group">
            <img
              className="logo__image"
              src={energyLogo}
              alt="Энергоэффект"
            />

            <img
              className="logo__anniversary"
              src={anniversaryLogo}
              alt="12 лет"
            />
          </span>
        </a>

        <nav className="nav" aria-label="Основная навигация">
          {navigation.map((item) => {
            const isActive = activeNavUrl === item.url;

            return (
              <Link
                to={item.url}
                key={item.title}
                className={`nav__link ${isActive ? "nav__link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <a className="header__phone" href="tel:+78004440766">
          +7 800 444-07-66
        </a>
      </div>
    </header>
  );
}

export default Header;