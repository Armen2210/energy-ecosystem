// =========================================================
// APP / КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// Здесь подключается общая структура сайта:
// Header, маршруты страниц и Footer.
// =========================================================

import { Route, Routes } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";

import { navigation } from "./data/navigation";

import AboutPage from "./pages/AboutPage";
import CasesPage from "./pages/CasesPage";
import ContactsPage from "./pages/ContactsPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import ServicePage from "./pages/ServicePage";
import ServicesPage from "./pages/ServicesPage";
import SolutionsPage from "./pages/SolutionsPage";

import "./App.css";

function App() {
  return (
    <div className="site">
      <Header navigation={navigation} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/solutions/:slug" element={<ProductPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:slug" element={<ServicePage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
      </Routes>

      <Footer navigation={navigation} />
    </div>
  );
}

export default App;