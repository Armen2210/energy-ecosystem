// =========================================================
// PRODUCT CARD / КАРТОЧКА ПРОДУКТА
// Универсальная карточка продуктового направления.
// Данные приходят из src/data/products.js.
// =========================================================

function ProductCard({ product, index }) {
  return (
    <article className="product-card">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{product.title}</h3>
      <p>{product.description}</p>
    </article>
  );
}

export default ProductCard;