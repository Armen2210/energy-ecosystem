// =========================================================
// SCROLL TO TOP / ПРОКРУТКА ПРИ СМЕНЕ СТРАНИЦЫ
// Управляет поведением страницы при переходах:
// - обычные страницы открываются сверху;
// - hash-ссылки плавно ведут к секциям;
// - product/service pages сначала открываются у карточки заявки,
//   затем плавно поднимаются к началу страницы;
// - модальные кейсы не меняют позицию фоновой страницы.
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

  /*
    SECTION SCROLL / ПРОКРУТКА К СЕКЦИИ
    Скроллим к самой секции, но добавляем небольшой сдвиг вниз.
    Это нужно, чтобы при переходе из навигации пользователь попадал
    не “чуть раньше” блока, а видел начало нужного смыслового раздела.
  */
  const headerHeight = getHeaderHeight();
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;
  const visualOffset = 12;

  return Math.max(sectionTop - headerHeight + visualOffset, 0);
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

    /*
      CASE MODAL / МОДАЛЬНЫЙ КЕЙС

      Если кейс открыт поверх текущей страницы,
      не меняем положение фоновой страницы.
    */
    if (state?.backgroundLocation) {
      return;
    }

    /*
    CASE RETURN / ВОЗВРАТ ИЗ МОДАЛЬНОГО КЕЙСА

    Desktop:
    возвращаем точную позицию страницы, на которой был открыт кейс.

    Mobile:
    центрируем просмотренную карточку, чтобы пользователь
    сразу понимал, какой именно кейс он только что закрыл.
  */
  if (state?.caseReturn) {
    disableGlobalSmoothScroll();

    const { slug, scrollY } = state.caseReturn;
    const isMobile = window.matchMedia("(max-width: 720px)").matches;

    const openedCaseCard = document.querySelector(
      `[data-case-slug="${slug}"]`
    );

    if (isMobile && openedCaseCard) {
      openedCaseCard.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });
    } else {
      window.scrollTo({
        top: scrollY || 0,
        left: 0,
        behavior: "auto",
      });
    }

    restoreGlobalSmoothScroll();

    return;
  }

    /*
      CASES DIRECT / ПРЯМОЙ ПЕРЕХОД К КЕЙСАМ

      Используется при возврате со страницы /cases.
      Главная открывается сразу в секции кейсов,
      без заметной плавной прокрутки от Hero.
    */
    if (state?.entryScroll === "cases-direct") {
      disableGlobalSmoothScroll();

      /*
        Прокручиваем страницу сразу внутри useLayoutEffect,
        до того как браузер покажет пользователю первый кадр.
        Благодаря этому Hero не должен мелькать перед секцией кейсов.
      */
      window.scrollTo({
        top: getSectionScrollTop("cases"),
        left: 0,
        behavior: "auto",
      });

      restoreGlobalSmoothScroll();
    
      return;
    }

    /*
      CONTACTS DIRECT / ПРЯМОЙ ПЕРЕХОД К КОНТАКТАМ

      Используется при переходе из модального кейса,
      открытого поверх страницы /cases.

      Позиция устанавливается до первого видимого кадра,
      поэтому Hero не мелькает.
    */
    if (state?.entryScroll === "contacts-direct") {
      disableGlobalSmoothScroll();

      window.scrollTo({
        top: getSectionScrollTop("contacts"),
        left: 0,
        behavior: "auto",
      });

      restoreGlobalSmoothScroll();

      return;
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
      /*
        HASH SCROLL / ПРОКРУТКА К СЕКЦИЯМ ГЛАВНОЙ
        Используем ручной расчёт позиции вместо scrollIntoView,
        чтобы стабильно учитывать sticky-header и избежать ситуации,
        когда адрес изменился, а прокрутка не произошла.
      */
      const sectionId = hash.replace("#", "");

      scrollTimer = setTimeout(() => {
        window.scrollTo({
          top: getSectionScrollTop(sectionId),
          left: 0,
          behavior: "smooth",
        });
      }, 80);

      return () => {
        clearTimeout(scrollTimer);
      };
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [pathname, hash, state, navigate, location.key]);

  return null;
}

export default ScrollToTop;