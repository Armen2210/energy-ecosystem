// =========================================================
// CASE CARD / КАРТОЧКА КЕЙСА
// Универсальная карточка реализованной инженерной задачи.
//
// Используется:
// - на главной странице;
// - на странице /cases.
//
// Если у кейса есть hasDetailPage: true,
// вся карточка становится ссылкой на детальный кейс.
// =========================================================

import { Link, useLocation } from "react-router-dom";

function CaseCard({ caseItem }) {
  const location = useLocation();

  const cardClassName = [
    "case-card",
    caseItem.coverImage ? "case-card--has-image" : "",
    caseItem.hasDetailPage ? "case-card--interactive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardContent = (
    <>
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

        {caseItem.hasDetailPage && (
          <div className="case-card__link">
            Подробнее о проекте
          </div>
        )}
      </div>
    </>
  );

  if (caseItem.hasDetailPage) {
    return (
      <Link
        className={cardClassName}
        to={caseItem.url}
        state={{ backgroundLocation: location }}
        aria-label={`Открыть кейс: ${caseItem.title}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article className={cardClassName}>
      {cardContent}
    </article>
  );
}

export default CaseCard;