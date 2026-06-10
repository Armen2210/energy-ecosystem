// =====================================================
// Footer сайта ТД «Энергоэффект»
//
// Задачи Footer:
// - дать короткое позиционирование ТД;
// - показать навигацию;
// - показать связь с экосистемой;
// - оставить контакты и юридическую ссылку.
//
// Footer сделан компактнее, чтобы не перегружать страницу.
// Навигация берётся из src/data/navigation.js.
// =====================================================

import { Link, useLocation, useNavigate } from "react-router-dom"

import { mainNavigation, serviceNavigation } from "../../data/navigation"

function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  // =====================================================
  // Переход к форме заявки
  //
  // CTA в Footer должен вести пользователя к форме на главной.
  // Если пользователь уже на главной — плавно скроллим.
  // Если пользователь на внутренней странице — сначала переходим
  // на главную, затем скроллим к форме.
  // =====================================================
  const handleContactsNavigation = (event) => {
    event.preventDefault()

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

  // =====================================================
  // Навигация Footer по секциям главной страницы
  //
  // Если ссылка содержит hash (#directions, #solutions),
  // скроллим к нужной секции на главной.
  //
  // Если пользователь находится на внутренней странице —
  // сначала переходим на главную, затем скроллим к секции.
  //
  // Если ссылка ведёт на обычную страницу, например /about,
  // выполняем обычный переход через navigate().
  // =====================================================
  const handleFooterNavigation = (event, path) => {
    if (!path.includes("#")) {
      event.preventDefault()
      navigate(path)
      return
    }

    event.preventDefault()

    const sectionId = path.split("#")[1]

    window.dispatchEvent(
      new CustomEvent("td-section-change", {
        detail: sectionId,
      })
    )

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

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <h3>ТД Энергоэффект</h3>

            <p>
              Комплектация инженерных объектов, подбор оборудования и
              сопровождение поставок для строительных и производственных задач.
            </p>

            <div className="footer__legal">
              <span>© 2026 ТД Энергоэффект</span>

              {serviceNavigation.map((item) => (
                <Link key={item.path} to={item.path}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <nav className="footer__column" aria-label="Навигация в подвале">
            <h4>Навигация</h4>

            {mainNavigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(event) => handleFooterNavigation(event, item.path)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="footer__column">
              <h4>Экосистема</h4>

              <span>ТД Энергоэффект — комплектация инженерных объектов</span>

              <a
                href="https://www.energoeffekt-rostov.ru/"
                target="_blank"
                rel="noreferrer"
              >
                Энергоэффект — производственные решения
              </a>

              <a
                href="https://teplouchet.com/"
                target="_blank"
                rel="noreferrer"
              >
                Теплоучет — оборудование и комплектующие
              </a>
          </div>

          <div className="footer__column footer__contacts">
            <h4>Контакты</h4>

            <a href="tel:+79381246802">+7 (938) 124-68-02</a>
            <a href="mailto:salestd@ee-don.ru">salestd@ee-don.ru</a>
            <span>Ростов-на-Дону</span>

            <a
              href="#contacts"
              className="footer__cta"
              onClick={handleContactsNavigation}
            >
              Обсудить проект
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer