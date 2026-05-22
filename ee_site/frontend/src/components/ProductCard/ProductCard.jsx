// =========================================================
// PRODUCT CARD / КАРТОЧКА ПРОДУКТА
// Универсальная карточка продуктового направления.
// Данные приходят из src/data/products.js.
// Карточка ведёт на отдельную SEO-страницу продукта.
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ProductCard({ product, index }) {
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
      className={`product-card ${isLeaving ? "product-card--leaving" : ""}`}
      to={product.url}
      state={{ entryScroll: "lead-card-then-top" }}
      onClick={handleClick}
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{product.title}</h3>
      <p>{product.description}</p>
    </Link>
  );
}

export default ProductCard;