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

import Home from "./pages/Home"
import About from "./pages/About"
import Supply from "./pages/Supply"
import Directions from "./pages/Directions"
import Cases from "./pages/Cases"
import Contacts from "./pages/Contacts"
import Privacy from "./pages/Privacy"

import Footer from "./components/Footer"
import CookieBanner from "./components/CookieBanner"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/supply" element={<Supply />} />
        <Route path="/directions" element={<Directions />} />
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