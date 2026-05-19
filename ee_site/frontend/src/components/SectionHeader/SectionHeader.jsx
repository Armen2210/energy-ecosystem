// =========================================================
// SECTION HEADER / ЗАГОЛОВОК СЕКЦИИ
// Универсальный компонент для заголовков крупных блоков.
// Используется в продуктах, услугах, кейсах, процессе и т.д.
// =========================================================

function SectionHeader({ eyebrow, title, description, theme = "light" }) {
  const isDark = theme === "dark";

  return (
    <div className={isDark ? "section__head section__head--light" : "section__head"}>
      {eyebrow && (
        <div className={isDark ? "eyebrow eyebrow--dark" : "eyebrow"}>
          {eyebrow}
        </div>
      )}

      <h2>{title}</h2>

      {description && <p>{description}</p>}
    </div>
  );
}

export default SectionHeader;