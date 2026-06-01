// =====================================================
// App сайта ТД «Энергоэффект»
//
// Отвечает за:
// - маршруты страниц;
// - общий Footer;
// - CookieBanner.
//
// Логика маршрутов сохранена без изменений.
// =====================================================

import { Routes, Route } from "react-router-dom"

import HomePage from "./pages/HomePage"
import AboutPage from "./pages/AboutPage"
import SupplyPage from "./pages/SupplyPage"
import DirectionsPage from "./pages/DirectionsPage"
import Cases from "./pages/Cases"
import Contacts from "./pages/Contacts"
import Privacy from "./pages/Privacy"

import Footer from "./components/Footer"
import CookieBanner from "./components/CookieBanner"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/supply" element={<SupplyPage />} />
        <Route path="/directions" element={<DirectionsPage />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>

      <Footer />
      <CookieBanner />
    </>
  )
}

export default App