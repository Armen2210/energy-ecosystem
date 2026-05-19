// =========================================================
// TRUST BLOCK / БЛОК ДОВЕРИЯ
// Универсальный блок преимуществ.
// Используется на продуктовых и сервисных страницах.
// =========================================================

function TrustBlock({ title = "Почему это важно", items = [] }) {
  return (
    <div className="trust-block">
      <h2>{title}</h2>

      <div className="trust-block__grid">
        {items.map((item) => (
          <article className="trust-block__item" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default TrustBlock;