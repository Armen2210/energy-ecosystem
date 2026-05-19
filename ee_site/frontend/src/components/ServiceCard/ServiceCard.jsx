// =========================================================
// SERVICE CARD / КАРТОЧКА УСЛУГИ
// Универсальная карточка услуги компании.
// Данные приходят из src/data/services.js.
// =========================================================

function ServiceCard({ service, index }) {
  return (
    <article className="service-card">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
    </article>
  );
}

export default ServiceCard;