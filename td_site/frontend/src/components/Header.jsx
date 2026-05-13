import { useState } from "react"
import { NavLink, Link } from "react-router-dom"
import logo from "../assets/logo.png"

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
          <Link to="/" className="logo" onClick={closeMenu} aria-label="ТД Энергоэффект">
            <img src={logo} alt="ТД Энергоэффект" />
          </Link>

          <nav className={isMenuOpen ? "nav nav--open" : "nav"} aria-label="Основная навигация">
            <NavLink to="/directions" onClick={closeMenu} className={navLinkClass}>
              Направления
            </NavLink>

            <NavLink to="/supply" onClick={closeMenu} className={navLinkClass}>
              Решения
            </NavLink>

            <NavLink to="/cases" onClick={closeMenu} className={navLinkClass}>
              Кейсы
            </NavLink>

            <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>
              О компании
            </NavLink>

            <NavLink to="/contacts" onClick={closeMenu} className={navLinkClass}>
              Контакты
            </NavLink>

            <div className="nav__mobile-actions">
              <a href="tel:+70000000000" className="header__phone">
                +7 (000) 000-00-00
              </a>

              <NavLink to="/contacts" onClick={closeMenu} className="header__cta">
                Обсудить проект
              </NavLink>
            </div>
          </nav>

          <div className="header__actions">
            <a href="tel:+70000000000" className="header__phone">
              +7 (938) 169-31-09
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