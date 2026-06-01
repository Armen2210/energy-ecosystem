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
import CasesPage from "./pages/CasesPage"
import ContactsPage from "./pages/ContactsPage"
import PrivacyPage from "./pages/PrivacyPage"

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
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>

      <Footer />
      <CookieBanner />
    </>
  )
}

export default App