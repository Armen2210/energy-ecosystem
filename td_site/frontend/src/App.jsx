// =====================================================
// App сайта ТД «Энергоэффект»
//
// Отвечает за:
// - маршруты страниц;
// - редиректы старых страниц на секции главной;
// - общий Footer;
// - CookieBanner.
//
// Логика текущего этапа:
// - главная страница становится основной посадочной страницей;
// - /about остаётся отдельной страницей;
// - /privacy остаётся отдельной юридической страницей;
// - старые страницы /directions, /supply, /cases, /contacts
//   перенаправляются на соответствующие секции главной.
//
// Важно:
// файлы старых страниц пока не удаляем, чтобы не ломать проект резко.
// =====================================================

import { useEffect } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"

import HomePage from "./pages/HomePage"
import AboutPage from "./pages/AboutPage"
import PrivacyPage from "./pages/PrivacyPage"

import Footer from "./components/Footer"
import CookieBanner from "./components/CookieBanner"

// =====================================================
// LegacySectionRedirect
//
// Компонент для мягкого перенаправления старых маршрутов
// на секции главной страницы.
//
// Пример:
// /directions → / + scroll к #directions
// /supply     → / + scroll к #solutions
// /cases      → / + scroll к #cases
// /contacts   → / + scroll к #contacts
// =====================================================
function LegacySectionRedirect({ sectionId }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/", { replace: true })

    window.setTimeout(() => {
      const targetSection = document.getElementById(sectionId)

      if (!targetSection) {
        return
      }

      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }, [navigate, sectionId])

  return null
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* =====================================================
            СТАРЫЕ МАРШРУТЫ
            Оставляем безопасные редиректы вместо отдельных страниц.
        ===================================================== */}
        <Route
          path="/directions"
          element={<LegacySectionRedirect sectionId="directions" />}
        />

        <Route
          path="/supply"
          element={<LegacySectionRedirect sectionId="solutions" />}
        />

        <Route
          path="/cases"
          element={<LegacySectionRedirect sectionId="cases" />}
        />

        <Route
          path="/contacts"
          element={<LegacySectionRedirect sectionId="contacts" />}
        />
      </Routes>

      <Footer />
      <CookieBanner />
    </>
  )
}

export default App