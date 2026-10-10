// =========================================================
// APP / КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// Здесь подключается общая структура сайта:
// Header, маршруты страниц и Footer.
// =========================================================

import { useEffect } from "react";

import {
  useNavigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { SeoLocationContext } from "./components/Seo/location";

import CaseModal from "./components/CaseModal";
import CookieBanner from "./components/CookieBanner";
import Footer from "./components/Footer";
import Header from "./components/Header";

import { navigation } from "./data/navigation";
import { cases } from "./data/cases";

import AboutPage from "./pages/AboutPage";
import CasesPage from "./pages/CasesPage";
import CasePage from "./pages/CasePage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import ScrollToTop from "./components/ScrollToTop";
import ServicePage from "./pages/ServicePage";
import ServicesPage from "./pages/ServicesPage";
import SolutionsPage from "./pages/SolutionsPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./App.css";
import AnalyticsBridge from "./analytics/AnalyticsBridge";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Render home immediately at the alias, avoiding a footer-only frame.
  useEffect(() => {
    if (/^\/contacts\/?$/.test(location.pathname)) {
      navigate(`/${location.search}#contacts`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const isDetailedCase = cases.some((item) => item.hasDetailPage && item.url === location.pathname);
  const backgroundLocation = isDetailedCase ? location.state?.backgroundLocation : null;
  return (
    <SeoLocationContext.Provider value={location}>
    <div className="site">
      <AnalyticsBridge />
      <Header navigation={navigation} />

      <ScrollToTop />

      <Routes location={backgroundLocation || location}>
        <Route caseSensitive path="/" element={<HomePage />} />
        <Route caseSensitive path="/about" element={<AboutPage />} />
        <Route caseSensitive path="/solutions" element={<SolutionsPage />} />
        <Route caseSensitive path="/solutions/:slug" element={<ProductPage />} />
        <Route caseSensitive path="/services" element={<ServicesPage />} />
        <Route caseSensitive path="/services/:slug" element={<ServicePage />} />
        <Route caseSensitive path="/cases" element={<CasesPage />} />
        <Route caseSensitive path="/cases/:slug" element={<CasePage />} />
        <Route caseSensitive path="/contacts" element={<HomePage />} />
        <Route caseSensitive path="/privacy" element={<PrivacyPage />} />
        <Route caseSensitive path="*" element={<NotFoundPage />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route caseSensitive path="/cases/:slug" element={<CaseModal />} />
        </Routes>
      )}

      <Footer navigation={navigation} />
      <CookieBanner />
    </div>
    </SeoLocationContext.Provider>
  );
}

export default App;
