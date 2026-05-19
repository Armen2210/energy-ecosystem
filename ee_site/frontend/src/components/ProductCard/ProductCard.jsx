// =========================================================
// PRODUCT CARD / КАРТОЧКА ПРОДУКТА
// Универсальная карточка продуктового направления.
// Данные приходят из src/data/products.js.
// Карточка ведёт на отдельную SEO-страницу продукта.
// =========================================================

import { Link } from "react-router-dom";

function ProductCard({ product, index }) {
  return (
    <Link className="product-card" to={product.url}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{product.title}</h3>
      <p>{product.description}</p>
    </Link>
  );
}

export default ProductCard;