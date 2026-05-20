// =========================================================
// SCROLL TO TOP / ПРОКРУТКА ПРИ СМЕНЕ СТРАНИЦЫ
// Если маршрут без hash — открываем страницу сверху.
// Если маршрут с #summary — сначала попадаем на блок,
// затем сразу плавно поднимаемся к началу главной.
// =========================================================

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === "#summary") {
      const targetElement = document.querySelector(hash);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "instant",
          block: "start",
        });

        requestAnimationFrame(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
          });
        });
      }

      return;
    }

    if (hash) {
      const targetElement = document.querySelector(hash);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;