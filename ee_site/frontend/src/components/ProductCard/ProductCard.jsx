// =========================================================
// PRODUCT CARD / КАРТОЧКА ПРОДУКТА
// Универсальная кликабельная карточка продуктового направления.
// Данные приходят из src/data/products.js.
// Карточка ведёт на отдельную SEO-страницу продукта.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick(event) {
    /*
      Не ломаем стандартное поведение:
      Ctrl/Cmd + клик, Shift + клик, открытие в новой вкладке.
    */
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    setIsLeaving(true);

    timerRef.current = setTimeout(() => {
      navigate(product.url, {
        state: { entryScroll: "lead-card-then-top" },
      });
    }, 160);
  }

  return (
    <Link
      className={`product-card ${
        product.heroImage ? "product-card--has-image" : ""
      } ${isLeaving ? "product-card--leaving" : ""}`}
      to={product.url}
      state={{ entryScroll: "lead-card-then-top" }}
      onClick={handleClick}
      aria-label={`Перейти на страницу: ${product.title}`}
    >
      {product.heroImage && (
        <div className="product-card__media">
          <img
            src={product.heroImage}
            alt={product.heroImageAlt || product.title}
            loading="lazy"
          />
        </div>
      )}

      <div className="product-card__body">
        <span className="product-card__eyebrow">
          {product.shortTitle || product.switcherTitle}
        </span>

        <h3>{product.cardTitle || product.title}</h3>
        <p>{product.cardDescription || product.description}</p>

        <span className="product-card__cta">Подробнее</span>
      </div>
    </Link>
  );
}

export default ProductCard;