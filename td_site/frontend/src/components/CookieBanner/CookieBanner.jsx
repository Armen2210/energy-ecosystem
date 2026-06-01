import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const COOKIE_CONSENT_KEY = "td_cookie_consent"

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)

    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted")
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Уведомление о cookies">
      <p className="cookie-banner__text">
        Мы используем cookies и сервисы аналитики, чтобы улучшать работу сайта.
        Продолжая пользоваться сайтом, вы соглашаетесь с использованием cookies.{" "}
        <Link to="/privacy" className="cookie-banner__link">
          Подробнее
        </Link>
      </p>

      <button
        type="button"
        className="cookie-banner__button"
        onClick={handleAccept}
      >
        Хорошо
      </button>
    </div>
  )
}

export default CookieBanner