// =========================================================
// SCROLL TO TOP / ПРОКРУТКА ПРИ СМЕНЕ СТРАНИЦЫ
// Управляет поведением страницы при переходах:
// - обычные страницы открываются сверху;
// - hash-ссылки плавно ведут к секциям;
// - product/service pages сначала открываются у карточки заявки,
//   затем плавно поднимаются к началу страницы.
// =========================================================

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function getHeaderHeight() {
  return document.querySelector(".header")?.offsetHeight || 0;
}

function disableGlobalSmoothScroll() {
  document.documentElement.style.scrollBehavior = "auto";
}

function restoreGlobalSmoothScroll() {
  document.documentElement.style.scrollBehavior = "";
}

function getLeadCardScrollTop() {
  const leadCard = document.querySelector(".lead-form");

  if (!leadCard) {
    return 0;
  }

  const headerHeight = getHeaderHeight();
  const cardTop = leadCard.getBoundingClientRect().top + window.scrollY;

  /*
    Показываем карточку заявки аккуратно под шапкой.
    Не центрируем, чтобы не было риска кривого положения
    на разных экранах.
  */
  return Math.max(cardTop - headerHeight - 32, 0);
}

function animateScrollToTop(duration = 2200) {
  const startPosition = window.scrollY;
  const startTime = performance.now();

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    window.scrollTo({
      top: startPosition * (1 - easedProgress),
      left: 0,
      behavior: "auto",
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      restoreGlobalSmoothScroll();
    }
  }

  requestAnimationFrame(step);
}

function ScrollToTop() {
  const location = useLocation();
  const { pathname, hash, state } = location;

  useLayoutEffect(() => {
    let scrollTimer;

    if (state?.entryScroll === "lead-card-then-top") {
      disableGlobalSmoothScroll();

      /*
        Сразу ставим экран на карточку заявки.
        useLayoutEffect делает это до видимой отрисовки кадра,
        поэтому промежуточный экран не должен мелькать.
      */
      window.scrollTo({
        top: getLeadCardScrollTop(),
        left: 0,
        behavior: "auto",
      });

      /*
        Короткая пауза у заявки, затем плавный подъём наверх.
      */
      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "products-then-top") {
      disableGlobalSmoothScroll();

      const productsSection = document.getElementById("products");

      if (!productsSection) {
        restoreGlobalSmoothScroll();

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });

        return;
      }

      const headerHeight = getHeaderHeight();
      const sectionTop =
        productsSection.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(sectionTop - headerHeight - 24, 0),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "services-then-top") {
      disableGlobalSmoothScroll();

      const servicesSection = document.getElementById("services");

      if (!servicesSection) {
        restoreGlobalSmoothScroll();

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });

        return;
      }

      const headerHeight = getHeaderHeight();
      const sectionTop =
        servicesSection.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(sectionTop - headerHeight - 24, 0),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "top-smooth") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      return;
    }

    if (hash) {
      const targetElement = document.querySelector(hash);

      if (targetElement) {
        const headerHeight = getHeaderHeight();
        const elementTop =
          targetElement.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: Math.max(elementTop - headerHeight - 24, 0),
          left: 0,
          behavior: "smooth",
        });
      }

      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [pathname, hash, state]);

  return null;
}

export default ScrollToTop;