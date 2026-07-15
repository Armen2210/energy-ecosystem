// =========================================================
// CASE VIEW / ОБЩЕЕ ПРЕДСТАВЛЕНИЕ КЕЙСА
//
// Единое содержимое кейса для:
// - модального окна;
// - прямой страницы /cases/:slug.
//
// Содержит:
// - фотокарусель;
// - навигацию кнопками;
// - мобильный свайп;
// - анимацию смены изображения;
// - предзагрузку соседних фотографий;
// - метаданные, задачу и выполненные работы;
// - desktop- и mobile-CTA.
//
// Не отвечает за:
// - модальный фон;
// - крестик;
// - блокировку прокрутки страницы;
// - SEO и навигацию прямой страницы.
// =========================================================

import { useEffect, useRef, useState } from "react";

function CaseView({
  caseItem,
  onCtaClick,
  titleId = "case-view-title",
  showTopCta = true,
  showMobileCta = true,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const gallery = caseItem.gallery || [];
  const activeImage = gallery[activeImageIndex];

  /*
    При смене кейса возвращаем галерею
    к первой фотографии.
  */
  useEffect(() => {
    setActiveImageIndex(0);
  }, [caseItem.slug]);

  /*
    GALLERY PRELOAD / ПРЕДЗАГРУЗКА ФОТОГРАФИЙ

    Заранее загружаем предыдущую и следующую фотографии,
    чтобы переключение кнопками и свайпом происходило без паузы.
  */
  useEffect(() => {
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
  }, [activeImageIndex, gallery]);

  /*
      KEYBOARD GALLERY / УПРАВЛЕНИЕ ГАЛЕРЕЕЙ С КЛАВИАТУРЫ

      Стрелка влево — предыдущая фотография.
      Стрелка вправо — следующая фотография.

      Логика находится в общем компоненте, поэтому работает
      и в модальном окне, и на прямой странице кейса.
    */
  useEffect(() => {
      if (gallery.length < 2) {
        return;
      }

      function handleGalleryKeyDown(event) {
        if (event.key === "ArrowLeft") {
          setActiveImageIndex((currentIndex) =>
            currentIndex === 0
              ? gallery.length - 1
              : currentIndex - 1
          );
        }

        if (event.key === "ArrowRight") {
          setActiveImageIndex((currentIndex) =>
            currentIndex === gallery.length - 1
              ? 0
              : currentIndex + 1
          );
        }
      }

      window.addEventListener("keydown", handleGalleryKeyDown);

      return () => {
        window.removeEventListener("keydown", handleGalleryKeyDown);
      };
    }, [gallery.length]);

  const handlePreviousImage = () => {
    if (gallery.length < 2) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex === 0
        ? gallery.length - 1
        : currentIndex - 1
    );
  };

  const handleNextImage = () => {
    if (gallery.length < 2) {
      return;
    }

    setActiveImageIndex((currentIndex) =>
      currentIndex === gallery.length - 1
        ? 0
        : currentIndex + 1
    );
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const touch = event.changedTouches[0];

    const distanceX = touch.clientX - touchStartX.current;
    const distanceY = touch.clientY - touchStartY.current;

    const minimumSwipeDistance = 50;
    const isHorizontalSwipe =
      Math.abs(distanceX) > Math.abs(distanceY);

    if (
      isHorizontalSwipe &&
      Math.abs(distanceX) >= minimumSwipeDistance
    ) {
      if (distanceX < 0) {
        handleNextImage();
      } else {
        handlePreviousImage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
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
            {gallery.length
              ? `${activeImageIndex + 1} / ${gallery.length}`
              : "Фотографии отсутствуют"}
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

          {showTopCta && onCtaClick && (
            <button
              className="case-modal__top-cta"
              type="button"
              onClick={onCtaClick}
            >
              <span>Обсудить задачу</span>
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>

        <h2 id={titleId}>
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
            <strong>
              {caseItem.suppliedSystems.join(", ")}
            </strong>
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

        {showMobileCta && onCtaClick && (
          <div className="case-modal__mobile-cta">
            <button
              className="button button--primary case-modal__cta"
              type="button"
              onClick={onCtaClick}
            >
              {caseItem.cta.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseView;