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

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

function CaseCard({ caseItem }) {
  const location = useLocation();

  const navigate = useNavigate();

  const handleOpenCase = (event) => {
    /*
      Сохраняем стандартное поведение ссылки при открытии
      в новой вкладке через Ctrl / Cmd / Shift / среднюю кнопку.
    */
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    navigate(caseItem.url, {
      state: {
        backgroundLocation: {
          ...location,
          hash: "",
        },

        modalOrigin: {
          pathname: location.pathname,
          search: location.search,
          scrollY: window.scrollY,
          caseSlug: caseItem.slug,
        },
      },
    });
  };

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
        onClick={handleOpenCase}
        data-case-slug={caseItem.slug}
        aria-label={`Открыть кейс: ${caseItem.title}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      className={cardClassName}
      data-case-slug={caseItem.slug}
    >
      {cardContent}
    </article>
  );
}

export default CaseCard;