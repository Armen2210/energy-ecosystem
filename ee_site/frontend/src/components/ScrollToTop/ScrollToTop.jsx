// =========================================================
// SCROLL TO TOP / ПРОКРУТКА ПРИ СМЕНЕ СТРАНИЦЫ
// Управляет поведением страницы при переходах:
// - обычные страницы открываются сверху;
// - hash-ссылки плавно ведут к секциям;
// - product/service pages сначала открываются у карточки заявки,
//   затем плавно поднимаются к началу страницы.
// =========================================================

import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

function getSectionScrollTop(sectionId) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return 0;
  }

  const headerHeight = getHeaderHeight();
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;

  return Math.max(sectionTop - headerHeight - 24, 0);
}

function animateScrollToTop(duration = 2200, onComplete) {
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

      if (onComplete) {
        onComplete();
      }
    }
  }

  requestAnimationFrame(step);
}

function ScrollToTop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, hash, state } = location;

  useLayoutEffect(() => {
    let scrollTimer;

    function clearEntryScrollState() {
      navigate(`${pathname}${hash || ""}`, {
        replace: true,
        state: null,
      });
    }

    if (state?.entryScroll === "lead-card-then-top") {
      disableGlobalSmoothScroll();

      window.scrollTo({
        top: getLeadCardScrollTop(),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200, clearEntryScrollState);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "products-then-top") {
      disableGlobalSmoothScroll();

      window.scrollTo({
        top: getSectionScrollTop("products"),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200, clearEntryScrollState);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "services-then-top") {
      disableGlobalSmoothScroll();

      window.scrollTo({
        top: getSectionScrollTop("services"),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200, clearEntryScrollState);
      }, 180);

      return () => {
        clearTimeout(scrollTimer);
        restoreGlobalSmoothScroll();
      };
    }

    if (state?.entryScroll === "contacts-then-top") {
      disableGlobalSmoothScroll();

      window.scrollTo({
        top: getSectionScrollTop("contacts"),
        left: 0,
        behavior: "auto",
      });

      scrollTimer = setTimeout(() => {
        animateScrollToTop(2200, clearEntryScrollState);
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

      clearEntryScrollState();

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
  }, [pathname, hash, state, navigate]);

  return null;
}

export default ScrollToTop;