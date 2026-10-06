// =========================================================
// COOKIE BANNER / УВЕДОМЛЕНИЕ О COOKIES
// Небольшой production-ready баннер:
// - сообщает пользователю об использовании cookies;
// - ведёт на раздел /privacy#cookies;
// - запоминает согласие в localStorage.
// =========================================================

import { useState } from "react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "ee_cookie_consent";

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return !localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
      return true;
    }
  });

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // Storage may be unavailable; acceptance still applies to this visit.
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite">
      <div className="cookie-banner__content">
        <p>
          Мы используем cookies, чтобы сайт работал корректно и становился
          удобнее. Продолжая пользоваться сайтом, вы соглашаетесь с
          использованием cookies.
        </p>

        <div className="cookie-banner__actions">
          <Link to="/privacy#cookies">Подробнее</Link>

          <button type="button" onClick={handleAccept}>
            Хорошо
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;