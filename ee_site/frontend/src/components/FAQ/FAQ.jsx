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
// - основной FAQ размещаем на страницах конкретных продуктов и услуг.
// =========================================================

function FAQ({ items = [] }) {
  if (!items.length) {
    return null;
  }

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
        {items.map((item) => (
          <details className="faq__item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export default FAQ;