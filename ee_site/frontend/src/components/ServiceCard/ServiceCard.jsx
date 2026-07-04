// =========================================================
// SERVICE CARD / КАРТОЧКА УСЛУГИ
// Универсальная кликабельная карточка услуги компании.
// Данные приходят из src/data/services.js.
// Карточка ведёт на отдельную SEO-страницу услуги.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ServiceCard({ service }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const title = service.cardTitle || service.title;
  const description = service.cardDescription || service.description;


  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick(event) {
    /*
      Не ломаем стандартное поведение:
      Ctrl/Cmd + клик, Shift + клик, открытие в новой вкладке.
    */
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    setIsLeaving(true);

    timerRef.current = setTimeout(() => {
      navigate(service.url, {
        state: { entryScroll: "lead-card-then-top" },
      });
    }, 160);
  }

  return (
    <Link
      className={`service-card ${
        service.heroImage ? "service-card--has-image" : ""
      } ${isLeaving ? "service-card--leaving" : ""}`}
      to={service.url}
      state={{ entryScroll: "lead-card-then-top" }}
      onClick={handleClick}
      aria-label={`Перейти на страницу услуги: ${service.title}`}
    >
      {service.heroImage && (
        <div className="service-card__media">
          <img
            src={service.heroImage}
            alt={service.heroImageAlt || service.title}
            loading="lazy"
          />
        </div>
      )}

      <div className="service-card__body">


        <h3>{title}</h3>
        <p>{description}</p>

        <span className="service-card__cta">Подробнее</span>
      </div>
    </Link>
  );
}

export default ServiceCard;