// =========================================================
// INFO LIST BLOCK / ИНФОРМАЦИОННЫЙ СПИСОК
// Универсальный блок для вывода особенностей, применений,
// характеристик и других списков на страницах продукта.
// =========================================================

function InfoListBlock({ title, items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="info-list-block">
      <h2>{title}</h2>

      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default InfoListBlock;