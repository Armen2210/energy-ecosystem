// =========================================================
// AI SUMMARY / КРАТКОЕ СОДЕРЖАНИЕ СТРАНИЦЫ
//
// Универсальный AI-first блок для:
// - краткого объяснения сути страницы пользователю;
// - структурирования важного контента для поисковых систем;
// - лучшего понимания страницы AI-ассистентами и поиском.
//
// Компонент не содержит текстов конкретных продуктов или услуг.
// Все смыслы хранятся в data-файлах:
// - src/data/products.js
// - src/data/services.js
//
// Поддерживаемый формат:
// title — короткий заголовок плашки;
// lead — краткое вводное описание;
// items — список смысловых пунктов:
//   [
//     { label: "Задача", text: "..." },
//     { label: "Подход", text: "..." },
//     { label: "Для расчёта", text: "..." }
//   ]
// =========================================================

function AiSummary({ title, lead, items = [] }) {
  return (
    <aside className="ai-summary" aria-label="Краткое содержание страницы">
      {title && (
        <div className="ai-summary__header">
          <span className="ai-summary__label">{title}</span>
        </div>
      )}

      {lead && <p className="ai-summary__lead">{lead}</p>}

      {items.length > 0 && (
        <ul className="ai-summary__list">
          {items.map((item) => {
            const isObjectItem = typeof item === "object" && item !== null;

            const label = isObjectItem ? item.label : "";
            const text = isObjectItem ? item.text : item;

            return (
              <li className="ai-summary__item" key={`${label}-${text}`}>
                <span className="ai-summary__marker" aria-hidden="true" />

                <span className="ai-summary__text">
                  {label && <strong>{label}: </strong>}
                  {text}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

export default AiSummary;