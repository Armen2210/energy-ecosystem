import { useCallback, useEffect, useRef } from "react";
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
const INITIAL_INDICATOR_STYLE = {
  width: 0,
  height: "auto",
  transform: "translateX(0px)",
};

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

  const rootRef = useRef(null);
  const indicatorRef = useRef(null);
  const switchTimerRef = useRef(null);
  const currentIndex = items.findIndex((item) => item.slug === currentSlug);

  const currentItem = currentIndex >= 0 ? items[currentIndex] : null;

  const theme = currentItem?.theme || {};

  const switcherStyle = {
    "--entity-accent": theme.accent || "#f97316",
    "--entity-accent-soft": theme.accentSoft || "#fff3ea",
    "--entity-text": theme.text || "#111827",
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

  const updateIndicatorBySlug = useCallback((slug) => {
    const button = buttonRefs.current[slug];

    if (!button) {
      return;
    }

    const indicator = indicatorRef.current;
    if (!indicator) return;

    if (window.matchMedia("(min-width: 961px)").matches) {
      Object.assign(indicator.style, {
        width: "auto",
        height: `${button.offsetHeight}px`,
        transform: `translateY(${button.offsetTop}px)`,
      });

      return;
    }

    Object.assign(indicator.style, {
      width: `${button.offsetWidth}px`,
      height: "auto",
      transform: `translateX(${button.offsetLeft}px)`,
    });
  }, []);

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

  const scrollButtonIntoViewport = useCallback((slug, itemIndex) => {
    if (window.matchMedia("(min-width: 961px)").matches) {
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

    let targetLeft;

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
  }, [items.length, variant]);

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

      rootRef.current?.style.setProperty(
        "--entity-sticky-top", `${headerHeight}px`,
      );
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

  // Geometry belongs to the DOM: synchronize the indicator without rerenders.
  // ResizeObserver also covers font swaps and responsive button wrapping.
  useEffect(() => {
    updateIndicatorBySlug(currentSlug);
    scrollButtonIntoViewport(currentSlug, currentIndex);

    const updateIndicator = () => updateIndicatorBySlug(currentSlug);
    const observer = "ResizeObserver" in window
      ? new ResizeObserver(updateIndicator)
      : null;
    if (listRef.current) observer?.observe(listRef.current);
    Object.values(buttonRefs.current).forEach((button) => observer?.observe(button));
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [currentSlug, currentIndex, items, updateIndicatorBySlug, scrollButtonIntoViewport]);

  useEffect(() => () => {
    window.clearTimeout(switchTimerRef.current);
  }, [currentSlug]);

  /* =========================================================
     SWITCH / ПЕРЕКЛЮЧЕНИЕ МЕЖДУ СТРАНИЦАМИ
     ========================================================= */

  function handleSwitch(nextItem, nextIndex) {
    window.clearTimeout(switchTimerRef.current);
    if (!nextItem || nextItem.slug === currentSlug) {
      updateIndicatorBySlug(currentSlug);
      return;
    }

    const direction = nextIndex > currentIndex ? "right" : "left";
    const nextUrl = getItemUrl(nextItem, basePath);

    updateIndicatorBySlug(nextItem.slug);

    scrollButtonIntoViewport(nextItem.slug, nextIndex);

    switchTimerRef.current = window.setTimeout(() => {
      switchTimerRef.current = null;
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
      ref={rootRef}
      className={`entity-switcher entity-switcher--${variant}`}
      style={switcherStyle}
      aria-label={ariaLabel}
    >
      <div className="entity-switcher__viewport">
        <div ref={listRef} className="entity-switcher__list">
          <span
            className="entity-switcher__indicator"
            ref={indicatorRef}
            style={INITIAL_INDICATOR_STYLE}
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
                  } else {
                    delete buttonRefs.current[item.slug];
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