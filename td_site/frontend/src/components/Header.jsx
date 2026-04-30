import { useState } from "react"
import { NavLink } from "react-router-dom"
import logo from "../assets/logo.png"

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header__inner">

          <NavLink to="/" className="logo" onClick={closeMenu}>
            <img src={logo} alt="ТД Энергоэффект" />
          </NavLink>

          <button
            className="burger"
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            ☰
          </button>

          <nav className={isMenuOpen ? "nav nav--open" : "nav"}>
            <NavLink to="/" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              Главная
            </NavLink>

            <NavLink to="/about" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              О компании
            </NavLink>

            <NavLink to="/supply" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              Поставка
            </NavLink>

            <NavLink to="/directions" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              Направления
            </NavLink>

            <NavLink to="/cases" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              Кейсы
            </NavLink>

            <NavLink to="/contacts" onClick={closeMenu} className={({ isActive }) =>
              isActive ? "nav__link nav__link--active" : "nav__link"
            }>
              Контакты
            </NavLink>
          </nav>

        </div>
      </div>
    </header>
  )
}

export default Header