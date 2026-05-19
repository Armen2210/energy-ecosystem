// =========================================================
// AI SUMMARY / КРАТКОЕ ОПИСАНИЕ ДЛЯ ЛЮДЕЙ И ИИ
// Блок помогает быстро понять смысл страницы:
// пользователю, поисковику и AI-агенту.
// =========================================================

function AiSummary({ title, items = [] }) {
  return (
    <aside className="ai-summary" aria-label="Краткое содержание страницы">
      <div className="ai-summary__label">Кратко о странице</div>

      <h2>{title}</h2>

      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

export default AiSummary;