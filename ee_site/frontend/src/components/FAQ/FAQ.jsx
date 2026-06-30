// =========================================================
// FAQ / ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
// Reusable-компонент для продуктовых и сервисных страниц.
//
// Зачем нужен:
// - UX: пользователь быстро получает ответы;
// - SEO/AEO/GEO: поисковики и AI-системы лучше понимают страницу;
// - AI-ready: FAQ дополнительно отдаётся как структурированные данные.
//
// Важно:
// - компонент визуально компактный;
// - на главную страницу пока не подключаем;
// - основной FAQ размещаем на страницах конкретных продуктов и услуг;
// - в FAQ используем шеврон, а не плюс, чтобы визуально отличать
//   его от крупной продуктовой гармошки;
// - раскрытие/закрытие выполняется плавно;
// - состояние открытых вопросов хранится отдельно для каждой страницы.
// =========================================================

import { useMemo, useState } from "react";

function FAQ({ items = [], stateKey = "default" }) {
  const [openItemsByKey, setOpenItemsByKey] = useState({});

  const safeStateKey = useMemo(
    () => stateKey.replace(/[^a-zA-Z0-9_-]/g, "-"),
    [stateKey]
  );

  const openItems = openItemsByKey[stateKey] || [];

  if (!items.length) {
    return null;
  }

  const toggleItem = (index) => {
    setOpenItemsByKey((currentState) => {
      const currentItems = currentState[stateKey] || [];
      const isOpen = currentItems.includes(index);

      const nextItems = isOpen
        ? currentItems.filter((itemIndex) => itemIndex !== index)
        : [...currentItems, index];

      return {
        ...currentState,
        [stateKey]: nextItems,
      };
    });
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* =====================================================
          FAQ SCHEMA / JSON-LD
          Структурированные данные для поисковых систем,
          answer engines и AI-агентов.
          ===================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <div className="faq">
        {items.map((item, index) => {
          const isOpen = openItems.includes(index);
          const buttonId = `faq-button-${safeStateKey}-${index}`;
          const panelId = `faq-panel-${safeStateKey}-${index}`;

          return (
            <article
              className={`faq__item ${isOpen ? "faq__item--open" : ""}`}
              key={item.question}
            >
              <button
                id={buttonId}
                className="faq__summary"
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(index)}
              >
                <span className="faq__question">{item.question}</span>
                <span className="faq__chevron" aria-hidden="true" />
              </button>

              <div
                id={panelId}
                className="faq__panel"
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
              >
                <div className="faq__content">
                  <p className="faq__answer">{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default FAQ;