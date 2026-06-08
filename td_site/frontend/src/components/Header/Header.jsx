// =====================================================
// Header сайта ТД «Энергоэффект»
//
// Отвечает за:
// - логотип;
// - основную навигацию;
// - телефон;
// - CTA.
//
// Навигация берётся из src/data/navigation.js,
// чтобы пункты меню не были захардкожены в компоненте.
//
// Важно:
// мобильная версия работает без burger-меню.
// Навигация остаётся видимой и горизонтально прокручиваемой,
// как в логике сайта ЭЭ.
// =====================================================

import { useEffect, useState } from "react"
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom"

import logo from "../../assets/logo.png"
import { mainNavigation } from "../../data/navigation"

function Header() {
  const [activeSection, setActiveSection] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

  // =====================================================
  // Синхронизация активного пункта Header
  //
  // Header меняет активный пункт при клике по верхнему меню.
  // Если пользователь нажимает навигацию в Footer,
  // Footer отправляет событие td-section-change.
  // Header принимает событие и обновляет активный пункт.
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

  // =====================================================
  // Навигация по секциям главной страницы
  //
  // Если пункт меню содержит hash (#directions, #solutions),
  // скроллим к нужной секции на главной.
  //
  // Если пользователь находится на внутренней странице —
  // сначала переходим на главную, затем скроллим к секции.
  //
  // Если ссылка ведёт на обычную страницу, например /about,
  // выполняем переход через navigate().
  // =====================================================
  const handleMainNavigation = (event, path) => {
    if (!path.includes("#")) {
      event.preventDefault()
      setActiveSection(null)
      navigate(path)
      return
    }

    event.preventDefault()

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
  // CTA в Header ведёт пользователя к форме на главной.
  // Если пользователь уже на главной — плавно скроллим.
  // Если пользователь на внутренней странице — сначала
  // переходим на главную, затем скроллим к форме.
  // =====================================================
  const handleContactsNavigation = (event) => {
    event.preventDefault()

    setActiveSection("contacts")

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
            aria-label="ТД Энергоэффект"
            onClick={() => setActiveSection(null)}
          >
            <img src={logo} alt="ТД Энергоэффект" />
          </Link>

          <nav className="nav" aria-label="Основная навигация">
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
          </nav>

          <div className="header__actions">
            <a href="tel:+79381246802" className="header__phone">
              +7 (938) 124-68-02
            </a>

            <a
              href="#contacts"
              onClick={handleContactsNavigation}
              className="header__cta"
            >
              Обсудить проект
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header