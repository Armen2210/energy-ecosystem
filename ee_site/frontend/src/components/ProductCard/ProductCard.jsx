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

  const title = product.cardTitle || product.title;
  const description = product.cardDescription || product.description;
  const marker = product.shortTitle || product.switcherTitle;

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
      } ${product.lineLogo ? "product-card--has-line-logo" : ""} ${
        isLeaving ? "product-card--leaving" : ""
      }`}
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
        <div className="product-card__brand">
          {product.lineLogo ? (
            <img
              className="product-card__line-logo"
              src={product.lineLogo}
              alt={product.lineLogoAlt || title}
              loading="lazy"
            />
          ) : (
            <span className="product-card__marker">{marker}</span>
          )}
        </div>

        <h3>{title}</h3>
        <p>{description}</p>

        <span className="product-card__cta">Подробнее</span>
      </div>
    </Link>
  );
}

export default ProductCard;