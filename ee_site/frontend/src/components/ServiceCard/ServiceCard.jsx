// =========================================================
// SERVICE CARD / КАРТОЧКА УСЛУГИ
// Универсальная карточка услуги компании.
// Данные приходят из src/data/services.js.
// Карточка ведёт на отдельную SEO-страницу услуги.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ServiceCard({ service, index }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [isLeaving, setIsLeaving] = useState(false);

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
      className={`service-card ${isLeaving ? "service-card--leaving" : ""}`}
      to={service.url}
      state={{ entryScroll: "lead-card-then-top" }}
      onClick={handleClick}
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
    </Link>
  );
}

export default ServiceCard;