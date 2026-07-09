// =========================================================
// CASE CARD / КАРТОЧКА КЕЙСА
// Универсальная карточка реализованной инженерной задачи.
// Используется на главной и на странице /cases.
// Пока без перехода внутрь отдельного кейса.
// =========================================================

function CaseCard({ caseItem }) {
  return (
    <article
      className={`case-card ${
        caseItem.coverImage ? "case-card--has-image" : ""
      }`}
    >
      {caseItem.coverImage && (
        <div className="case-card__media">
          <img
            src={caseItem.coverImage}
            alt={caseItem.coverImageAlt || caseItem.title}
            loading="lazy"
          />
        </div>
      )}

      <div className="case-card__body">
        <span>{caseItem.type}</span>
        <h3>{caseItem.title}</h3>
        <p>{caseItem.previewDescription || caseItem.description}</p>
      </div>
    </article>
  );
}

export default CaseCard;