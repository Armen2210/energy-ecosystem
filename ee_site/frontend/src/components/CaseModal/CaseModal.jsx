// =========================================================
// CASE MODAL / МОДАЛЬНОЕ ОКНО КЕЙСА
//
// Открывает кейс поверх страницы, с которой пришёл пользователь.
//
// Поддерживает:
// - фотокарусель;
// - переключение кнопками;
// - закрытие по крестику;
// - закрытие по клику на фон;
// - закрытие клавишей Escape;
// - блокировку прокрутки фоновой страницы.
// =========================================================

import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { cases } from "../../data/cases";

function CaseModal() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const caseItem = cases.find((item) => item.slug === slug);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        navigate(-1);
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((currentIndex) => {
          const galleryLength = caseItem?.gallery?.length || 0;

          if (!galleryLength) {
            return 0;
          }

          return currentIndex === 0
            ? galleryLength - 1
            : currentIndex - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((currentIndex) => {
          const galleryLength = caseItem?.gallery?.length || 0;

          if (!galleryLength) {
            return 0;
          }

          return currentIndex === galleryLength - 1
            ? 0
            : currentIndex + 1;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [caseItem, navigate]);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <Navigate to="/cases" replace />;
  }

  const gallery = caseItem.gallery || [];
  const activeImage = gallery[activeImageIndex];

  const handleClose = () => {
    navigate(-1);
  };

  const handlePreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? gallery.length - 1 : currentIndex - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === gallery.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <div className="case-modal" role="dialog" aria-modal="true">
      <div
        className="case-modal__backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className="case-modal__panel"
        aria-labelledby="case-modal-title"
      >
        <button
          className="case-modal__close"
          type="button"
          onClick={handleClose}
          aria-label="Закрыть кейс"
        >
          <span aria-hidden="true" />
        </button>

        <div className="case-modal__layout">
          <div className="case-modal__gallery-column">
            {activeImage && (
              <div className="case-modal__gallery">
                <img
                  src={activeImage.image}
                  alt={activeImage.alt}
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      className="case-modal__gallery-button case-modal__gallery-button--previous"
                      type="button"
                      onClick={handlePreviousImage}
                      aria-label="Предыдущая фотография"
                    >
                      <span aria-hidden="true" />
                    </button>

                    <button
                      className="case-modal__gallery-button case-modal__gallery-button--next"
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Следующая фотография"
                    >
                      <span aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="case-modal__gallery-meta">
              <span>
                {activeImageIndex + 1} / {gallery.length}
              </span>

              {activeImage?.caption && (
                <p>{activeImage.caption}</p>
              )}
            </div>
          </div>

          <div className="case-modal__content">
            <div className="case-modal__meta">
              <span>{caseItem.type}</span>
              <span>{caseItem.location}</span>
              <span>{caseItem.year}</span>
              <span>{caseItem.projectDuration}</span>
            </div>

            <h2 id="case-modal-title">
              {caseItem.heroTitle}
            </h2>

            <p className="case-modal__lead">
              {caseItem.heroSubtitle}
            </p>

            <div className="case-modal__facts">
              <div>
                <span>Объект</span>
                <strong>{caseItem.objectType}</strong>
              </div>

              <div>
                <span>Системы</span>
                <strong>{caseItem.suppliedSystems.join(", ")}</strong>
              </div>
            </div>

            <div className="case-modal__text-block">
              <h3>{caseItem.task.title}</h3>

              {caseItem.task.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="case-modal__text-block">
              <h3>{caseItem.completedWorks.title}</h3>

              <ul>
                {caseItem.completedWorks.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <a
              className="button button--primary case-modal__cta"
              href="/#contacts"
            >
              {caseItem.cta.buttonText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseModal;