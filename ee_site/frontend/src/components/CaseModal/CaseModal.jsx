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

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { cases } from "../../data/cases";

function CaseModal() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const caseItem = cases.find((item) => item.slug === slug);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const modalOrigin = location.state?.modalOrigin;

  const touchStartX = useRef(null);

  const touchStartY = useRef(null);

  const modalPanelRef = useRef(null);
  const closeButtonRef = useRef(null);

  const handleClose = useCallback(() => {
    const returnPath = modalOrigin
      ? `${modalOrigin.pathname}${modalOrigin.search || ""}`
      : "/cases";

    navigate(returnPath, {
      replace: true,
      state: {
        caseReturn: {
          slug: caseItem?.slug || slug,
          scrollY: modalOrigin?.scrollY ?? 0,
        },
      },
    });
  }, [caseItem?.slug, modalOrigin, navigate, slug]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const previouslyFocusedElement = document.activeElement;

    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleClose();
      }

      if (event.key === "Tab") {
        const focusableElements = modalPanelRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === firstFocusableElement
        ) {
          event.preventDefault();
          lastFocusableElement.focus();
        }

        if (
          !event.shiftKey &&
          document.activeElement === lastFocusableElement
        ) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
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
      previouslyFocusedElement?.focus?.();
    };
  }, [caseItem, handleClose]);

  /*
    GALLERY PRELOAD / ПРЕДЗАГРУЗКА ФОТОГРАФИЙ

    Заранее загружаем предыдущую и следующую фотографии,
    чтобы переключение кнопками и свайпом происходило без паузы.
  */
  useEffect(() => {
    const gallery = caseItem?.gallery || [];

    if (gallery.length < 2) {
      return;
    }

    const previousImageIndex =
      activeImageIndex === 0
        ? gallery.length - 1
        : activeImageIndex - 1;

    const nextImageIndex =
      activeImageIndex === gallery.length - 1
        ? 0
        : activeImageIndex + 1;

    [previousImageIndex, nextImageIndex].forEach((imageIndex) => {
      const imageSource = gallery[imageIndex]?.image;

      if (!imageSource) {
        return;
      }

      const preloadImage = new Image();
      preloadImage.src = imageSource;
    });
  }, [activeImageIndex, caseItem]);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <Navigate to="/cases" replace />;
  }

  const gallery = caseItem.gallery || [];
  const activeImage = gallery[activeImageIndex];

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

  const handleTouchStart = (event) => {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = event.changedTouches[0];

    const distanceX = touch.clientX - touchStartX.current;
    const distanceY = touch.clientY - touchStartY.current;

    const minimumSwipeDistance = 50;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) >= minimumSwipeDistance) {
      if (distanceX < 0) {
        handleNextImage();
      } else {
        handlePreviousImage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleCtaClick = () => {
    const backgroundPathname =
      location.state?.backgroundLocation?.pathname;

    if (backgroundPathname === "/cases") {
      navigate("/#contacts", {
        state: { entryScroll: "contacts-direct" },
      });

      return;
    }

    navigate("/#contacts");
  };

  return (
    <div className="case-modal" role="dialog" aria-modal="true">
      <div
        className="case-modal__backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={modalPanelRef}
        className="case-modal__panel"
        aria-labelledby="case-modal-title"
      >
        <button
          ref={closeButtonRef}
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
              <div
                className="case-modal__gallery"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  key={`${caseItem.slug}-${activeImageIndex}`}
                  className="case-modal__gallery-image"
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
            <div className="case-modal__topbar">
              <div className="case-modal__meta">
                <span>{caseItem.type}</span>
                <span>{caseItem.location}</span>
                <span>{caseItem.year}</span>
                <span>{caseItem.projectDuration}</span>
              </div>

              <button
                className="case-modal__top-cta"
                type="button"
                onClick={handleCtaClick}
              >
                <span>Обсудить задачу</span>
                <span aria-hidden="true">↗</span>
              </button>
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

            <div className="case-modal__mobile-cta">
              <button
                className="button button--primary case-modal__cta"
                type="button"
                onClick={handleCtaClick}
              >
                {caseItem.cta.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseModal;