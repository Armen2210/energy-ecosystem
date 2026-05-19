// =========================================================
// SCROLL TO TOP / ПРОКРУТКА ВВЕРХ ПРИ СМЕНЕ СТРАНИЦЫ
// Нужен после подключения React Router.
// Без него новая страница может открываться в старой позиции скролла.
// =========================================================

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;