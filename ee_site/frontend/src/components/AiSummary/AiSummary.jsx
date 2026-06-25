// =========================================================
// AI SUMMARY / КРАТКОЕ ОПИСАНИЕ ДЛЯ ЛЮДЕЙ И ИИ
// Компактный AI-first блок:
// title выводится в плашке, список сохраняет структуру страницы.
// =========================================================

function AiSummary({ title, items = [] }) {
  return (
    <aside className="ai-summary ai-summary--compact" aria-label="Краткое содержание страницы">
      <div className="ai-summary__label">{title}</div>

      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

export default AiSummary;