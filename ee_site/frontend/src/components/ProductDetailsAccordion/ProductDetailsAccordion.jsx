// =========================================================
// PRODUCT DETAILS ACCORDION / ГАРМОШКА ДЕТАЛЕЙ ПРОДУКТА
//
// Универсальный компонент для раскрывающихся смысловых блоков
// на продуктовых страницах.
//
// Задачи:
// - показать подробности продукта без перегруза страницы;
// - первый блок раскрыт по умолчанию;
// - состояние открытого блока хранится отдельно для каждого продукта;
// - весь текст остаётся в DOM, чтобы контент был доступен
//   пользователю, поисковым системам и AI-агентам;
// - плюс остаётся плюсом, но при клике делает короткое вращение.
// =========================================================

import { useState } from "react";

function ProductDetailsAccordion({ sections = [], stateKey = "default" }) {
  const [openIndexByKey, setOpenIndexByKey] = useState({});
  const [spinningIndex, setSpinningIndex] = useState(null);

  if (!sections.length) {
    return null;
  }

  const hasSavedState = Object.prototype.hasOwnProperty.call(
    openIndexByKey,
    stateKey
  );

  const openIndex = hasSavedState ? openIndexByKey[stateKey] : 0;

  const handleToggle = (index) => {
    setOpenIndexByKey((currentState) => {
      const hasCurrentState = Object.prototype.hasOwnProperty.call(
        currentState,
        stateKey
      );

      const currentIndex = hasCurrentState ? currentState[stateKey] : 0;

      return {
        ...currentState,
        [stateKey]: currentIndex === index ? null : index,
      };
    });

    setSpinningIndex(index);

    window.setTimeout(() => {
      setSpinningIndex(null);
    }, 260);
  };

  return (
    <section
      className="product-details-accordion"
      aria-label="Подробная информация о продукте"
    >
      {sections.map((section, index) => {
        const isOpen = openIndex === index;
        const isSpinning = spinningIndex === index;

        return (
          <article
            className={`product-details-accordion__item ${
              isOpen ? "product-details-accordion__item--open" : ""
            }`}
            key={section.title}
          >
            <button
              className="product-details-accordion__button"
              type="button"
              aria-expanded={isOpen}
              onClick={() => handleToggle(index)}
            >
              <span>{section.title}</span>

              <span
                className={`product-details-accordion__icon ${
                  isSpinning ? "product-details-accordion__icon--spin" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className="product-details-accordion__panel"
              aria-hidden={!isOpen}
            >
              <div className="product-details-accordion__content">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default ProductDetailsAccordion;