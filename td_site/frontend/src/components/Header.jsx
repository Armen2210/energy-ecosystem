// =====================================================
// Header сайта ТД «Энергоэффект»
//
// Отвечает за:
// - логотип;
// - основную навигацию;
// - телефон;
// - CTA;
// - мобильное меню.
//
// Навигация берётся из src/data/navigation.js,
// чтобы пункты меню не были захардкожены в компоненте.
// =====================================================

import { useState } from "react"
import { NavLink, Link } from "react-router-dom"

import logo from "../assets/logo.png"
import { mainNavigation } from "../data/navigation"

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navLinkClass = ({ isActive }) =>
    isActive ? "nav__link nav__link--active" : "nav__link"

  return (
    <header className="header">
      <div className="container">
        <div className="header__inner">
          <Link
            to="/"
            className="logo"
            onClick={closeMenu}
            aria-label="ТД Энергоэффект"
          >
            <img src={logo} alt="ТД Энергоэффект" />
          </Link>

          <nav
            className={isMenuOpen ? "nav nav--open" : "nav"}
            aria-label="Основная навигация"
          >
            {mainNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}

            <div className="nav__mobile-actions">
              <a href="tel:+79381246802" className="header__phone">
                +7 (938) 124-68-02
              </a>

              <NavLink to="/contacts" onClick={closeMenu} className="header__cta">
                Обсудить проект
              </NavLink>
            </div>
          </nav>

          <div className="header__actions">
            <a href="tel:+79381246802" className="header__phone">
              +7 (938) 124-68-02
            </a>

            <NavLink to="/contacts" onClick={closeMenu} className="header__cta">
              Обсудить проект
            </NavLink>
          </div>

          <button
            className="burger"
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header