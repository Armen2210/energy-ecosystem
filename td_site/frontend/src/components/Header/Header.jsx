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

import { useEffect, useState } from "react"
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom"

import logo from "../../assets/logo.png"
import { mainNavigation } from "../../data/navigation"

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

    // =====================================================
  // Синхронизация активного пункта Header
  //
  // Header может менять активный пункт сам, когда пользователь
  // нажимает на верхнее меню.
  //
  // Но если пользователь нажимает навигацию в Footer,
  // Footer отправляет событие td-section-change.
  // Header принимает это событие и обновляет активный пункт.
  // =====================================================
  useEffect(() => {
    const handleSectionChange = (event) => {
      setActiveSection(event.detail)
    }

    window.addEventListener("td-section-change", handleSectionChange)

    return () => {
      window.removeEventListener("td-section-change", handleSectionChange)
    }
  }, [])

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

    // =====================================================
  // Навигация по секциям главной страницы
  //
  // Если пункт меню содержит hash (#directions, #solutions),
  // не открываем отдельную страницу, а скроллим к нужной
  // секции на главной.
  //
  // Если пользователь находится на внутренней странице —
  // сначала переходим на главную, затем скроллим к секции.
  // =====================================================
  const handleMainNavigation = (event, path) => {
    if (!path.includes("#")) {
      event.preventDefault()
      closeMenu()
      setActiveSection(null)
      navigate(path)
      return
    }

    event.preventDefault()
    closeMenu()

    const sectionId = path.split("#")[1]

    setActiveSection(sectionId)

    const scrollToSection = () => {
      const targetSection = document.getElementById(sectionId)

      if (!targetSection) {
        return
      }

      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    if (location.pathname === "/") {
      scrollToSection()
      return
    }

    navigate("/")

    window.setTimeout(() => {
      scrollToSection()
    }, 100)
  }

    // =====================================================
  // Переход к форме заявки
  //
  // CTA в Header должен вести пользователя к форме на главной.
  // Если пользователь уже на главной — плавно скроллим.
  // Если пользователь на внутренней странице — сначала переходим
  // на главную, затем скроллим к форме.
  // =====================================================
  const handleContactsNavigation = (event) => {
    event.preventDefault()
    closeMenu()

    const scrollToContacts = () => {
      const contactsSection = document.getElementById("contacts")

      if (!contactsSection) {
        return
      }

      contactsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    if (location.pathname === "/") {
      scrollToContacts()
      return
    }

    navigate("/")

    window.setTimeout(() => {
      scrollToContacts()
    }, 100)
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
            {mainNavigation.map((item) => {
              const isSectionLink = item.path.includes("#")
              const sectionId = isSectionLink ? item.path.split("#")[1] : null

              if (isSectionLink) {
                const sectionLinkClass =
                  activeSection === sectionId && location.pathname === "/"
                    ? "nav__link nav__link--active"
                    : "nav__link"

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(event) => handleMainNavigation(event, item.path)}
                    className={sectionLinkClass}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={(event) => handleMainNavigation(event, item.path)}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              )
            })}

            <div className="nav__mobile-actions">
              <a href="tel:+79381246802" className="header__phone">
                +7 (938) 124-68-02
              </a>

              <a href="#contacts" onClick={handleContactsNavigation} className="header__cta">
                  Обсудить проект
              </a>
            </div>
          </nav>

          <div className="header__actions">
            <a href="tel:+79381246802" className="header__phone">
              +7 (938) 124-68-02
            </a>

            <a href="#contacts" onClick={handleContactsNavigation} className="header__cta">
              Обсудить проект
            </a>
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