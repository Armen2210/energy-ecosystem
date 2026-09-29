import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   ENTITY SWITCHER / ПЕРЕКЛЮЧАТЕЛЬ ПРОДУКТОВ И УСЛУГ

   Универсальный компонент для внутренних страниц:
   - продукты переключаются только между продуктами;
   - услуги переключаются только между услугами;
   - направление перехода передаётся в location.state;
   - на desktop активная оболочка перемещается вертикально;
   - на tablet/mobile активная оболочка перемещается горизонтально.
   ========================================================= */

const SWITCH_DELAY_MS = 180;

function getItemUrl(item, basePath) {
  if (item.url) {
    return item.url;
  }

  return `${basePath}/${item.slug}`;
}

function getMotionSafeScrollBehavior() {
  if (typeof window === "undefined") {
    return "auto";
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export default function EntitySwitcher({
  items = [],
  currentSlug,
  basePath,
  variant = "default",
  ariaLabel = "Переключатель разделов",
}) {
  const navigate = useNavigate();

  const listRef = useRef(null);
  const buttonRefs = useRef({});

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    height: "auto",
    transform: "translateX(0px)",
  });

  const [stickyTop, setStickyTop] = useState(78);
  const [isDesktop, setIsDesktop] = useState(false);

  const currentIndex = useMemo(
    () => items.findIndex((item) => item.slug === currentSlug),
    [items, currentSlug],
  );

  const currentItem = currentIndex >= 0 ? items[currentIndex] : null;

  const theme = currentItem?.theme || {};

  const switcherStyle = {
    "--entity-accent": theme.accent || "#f97316",
    "--entity-accent-soft": theme.accentSoft || "#fff3ea",
    "--entity-text": theme.text || "#111827",
    "--entity-sticky-top": `${stickyTop}px`,
  };

  /* =========================================================
     INDICATOR / АКТИВНАЯ ОБОЛОЧКА

     Desktop:
     - рассчитываем высоту активной кнопки;
     - перемещаем оболочку по вертикальной оси.

     Tablet/mobile:
     - рассчитываем ширину активной кнопки;
     - перемещаем оболочку по горизонтальной оси.
     ========================================================= */

  function updateIndicatorBySlug(slug) {
    const button = buttonRefs.current[slug];

    if (!button) {
      return;
    }

    if (isDesktop) {
      setIndicatorStyle({
        width: "auto",
        height: button.offsetHeight,
        transform: `translateY(${button.offsetTop}px)`,
      });

      return;
    }

    setIndicatorStyle({
      width: button.offsetWidth,
      height: "auto",
      transform: `translateX(${button.offsetLeft}px)`,
    });
  }

  /* =========================================================
     MOBILE SCROLL / ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА ЛЕНТЫ

     На desktop прокрутка не требуется, так как переключатель
     становится вертикальным.

     На tablet/mobile сохраняем прежнюю механику:
     - первый элемент показываем от начала;
     - последний полностью выводим в видимую область;
     - услуги можно центрировать;
     - продукты сдвигаются только при необходимости.
     ========================================================= */

  function scrollButtonIntoViewport(slug, itemIndex) {
    if (isDesktop) {
      return;
    }

    const button = buttonRefs.current[slug];
    const viewport = button?.closest(".entity-switcher__viewport");

    if (!button || !viewport) {
      return;
    }

    const safeOffset = 14;
    const isFirstItem = itemIndex <= 0;
    const isLastItem = itemIndex >= items.length - 1;

    const buttonLeft = button.offsetLeft - safeOffset;
    const buttonRight =
      button.offsetLeft + button.offsetWidth + safeOffset;

    const visibleLeft = viewport.scrollLeft;
    const visibleRight = visibleLeft + viewport.clientWidth;

    let targetLeft = viewport.scrollLeft;

    if (isFirstItem) {
      targetLeft = 0;
    } else if (isLastItem) {
      targetLeft =
        button.offsetLeft +
        button.offsetWidth -
        viewport.clientWidth +
        safeOffset;
    } else if (variant === "services") {
      targetLeft =
        button.offsetLeft -
        (viewport.clientWidth - button.offsetWidth) / 2;
    } else {
      if (buttonLeft < visibleLeft) {
        targetLeft = Math.max(buttonLeft, 0);
      } else if (buttonRight > visibleRight) {
        targetLeft = buttonRight - viewport.clientWidth;
      } else {
        return;
      }
    }

    viewport.scrollTo({
      left: Math.max(targetLeft, 0),
      behavior: getMotionSafeScrollBehavior(),
    });
  }

  /* =========================================================
     STICKY TOP / ВЫСОТА HEADER

     Рассчитываем реальную высоту sticky-header.
     Если высота header изменяется, например из-за responsive,
     положение переключателя автоматически обновляется.
     ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const header = document.querySelector(".header");

    if (!header) {
      return undefined;
    }

    const updateStickyTop = () => {
      const headerHeight = Math.ceil(
        header.getBoundingClientRect().height,
      );

      setStickyTop(headerHeight);
    };

    updateStickyTop();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(updateStickyTop);

      resizeObserver.observe(header);

      return () => {
        resizeObserver.disconnect();
      };
    }

    window.addEventListener("resize", updateStickyTop);

    return () => {
      window.removeEventListener("resize", updateStickyTop);
    };
  }, []);

  /* =========================================================
     RESPONSIVE MODE / DESKTOP И MOBILE

     961px и выше:
     - вертикальный desktop-переключатель.

     960px и ниже:
     - существующая горизонтальная лента.
     ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 961px)");

    const updateDesktopMode = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateDesktopMode();

    mediaQuery.addEventListener("change", updateDesktopMode);

    return () => {
      mediaQuery.removeEventListener("change", updateDesktopMode);
    };
  }, []);

  /* =========================================================
     INDICATOR SYNC / СИНХРОНИЗАЦИЯ АКТИВНОЙ ОБОЛОЧКИ

     Пересчитываем положение:
     - при смене текущего элемента;
     - при изменении набора элементов;
     - при переходе между desktop и mobile;
     - при изменении размеров окна.
     ========================================================= */

  useEffect(() => {
    updateIndicatorBySlug(currentSlug);

    scrollButtonIntoViewport(currentSlug, currentIndex);

    const handleResize = () => {
      updateIndicatorBySlug(currentSlug);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [currentSlug, items, isDesktop]);

  /* =========================================================
     SWITCH / ПЕРЕКЛЮЧЕНИЕ МЕЖДУ СТРАНИЦАМИ
     ========================================================= */

  function handleSwitch(nextItem, nextIndex) {
    if (!nextItem || nextItem.slug === currentSlug) {
      return;
    }

    const direction = nextIndex > currentIndex ? "right" : "left";
    const nextUrl = getItemUrl(nextItem, basePath);

    updateIndicatorBySlug(nextItem.slug);

    scrollButtonIntoViewport(nextItem.slug, nextIndex);

    window.setTimeout(() => {
      navigate(nextUrl, {
        state: {
          entitySwitchDirection: direction,
          entitySwitchFrom: currentSlug,
          entitySwitchTo: nextItem.slug,
        },
      });
    }, SWITCH_DELAY_MS);
  }

  if (!items.length || currentIndex < 0) {
    return null;
  }

  return (
    <nav
      className={`entity-switcher entity-switcher--${variant}`}
      style={switcherStyle}
      aria-label={ariaLabel}
    >
      <div className="entity-switcher__viewport">
        <div ref={listRef} className="entity-switcher__list">
          <span
            className="entity-switcher__indicator"
            style={indicatorStyle}
            aria-hidden="true"
          />

          {items.map((item, index) => {
            const isActive = item.slug === currentSlug;
            const label =
              item.switcherTitle ||
              item.shortTitle ||
              item.title;

            return (
              <button
                key={item.slug}
                ref={(element) => {
                  if (element) {
                    buttonRefs.current[item.slug] = element;
                  }
                }}
                type="button"
                className={`entity-switcher__item ${
                  isActive ? "entity-switcher__item--active" : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleSwitch(item, index)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}