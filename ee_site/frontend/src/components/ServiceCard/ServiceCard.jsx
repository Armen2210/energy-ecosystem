// =========================================================
// SERVICE CARD / КАРТОЧКА УСЛУГИ
// Универсальная карточка услуги компании.
// Данные приходят из src/data/services.js.
// Карточка ведёт на отдельную SEO-страницу услуги.
// =========================================================

import { Link } from "react-router-dom";

function ServiceCard({ service, index }) {
  return (
    <Link className="service-card" to={service.url}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
    </Link>
  );
}

export default ServiceCard;