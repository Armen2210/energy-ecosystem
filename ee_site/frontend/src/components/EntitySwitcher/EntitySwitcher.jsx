import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   ENTITY SWITCHER / ПЕРЕКЛЮЧАТЕЛЬ ПРОДУКТОВ И УСЛУГ
   Универсальный компонент для внутренних страниц:
   - продукты переключаются только между продуктами;
   - услуги переключаются только между услугами;
   - направление перехода передаётся в location.state;
   - активная оболочка плавно перемещается к выбранному элементу.
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
    transform: "translateX(0px)",
  });

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
  };

  function updateIndicatorBySlug(slug) {
    const button = buttonRefs.current[slug];

    if (!button) {
      return;
    }

    setIndicatorStyle({
      width: button.offsetWidth,
      transform: `translateX(${button.offsetLeft}px)`,
    });
  }

    function scrollButtonIntoViewport(slug, itemIndex) {
    const button = buttonRefs.current[slug];
    const viewport = button?.closest(".entity-switcher__viewport");

    if (!button || !viewport) {
      return;
    }

    const safeOffset = 14;
    const isFirstItem = itemIndex <= 0;
    const isLastItem = itemIndex >= items.length - 1;

    const buttonLeft = button.offsetLeft - safeOffset;
    const buttonRight = button.offsetLeft + button.offsetWidth + safeOffset;

    const visibleLeft = viewport.scrollLeft;
    const visibleRight = visibleLeft + viewport.clientWidth;

    let targetLeft = viewport.scrollLeft;

    if (isFirstItem) {
      // Первый элемент показываем от начала ленты.
      targetLeft = 0;
    } else if (isLastItem) {
      // Последний элемент показываем полностью справа,
      // чтобы его правая граница не обрезалась.
      targetLeft =
        button.offsetLeft + button.offsetWidth - viewport.clientWidth + safeOffset;
    } else if (variant === "services") {
      // Центрирование нужно только для услуг:
      // Проектирование / СМР / ПНР.
      // Для продуктов это выглядит как лишний сдвиг.
      targetLeft =
        button.offsetLeft - (viewport.clientWidth - button.offsetWidth) / 2;
    } else {
      // Для продуктов не центрируем активную кнопку.
      // Только мягко возвращаем её в видимую область, если она обрезалась.
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
  }, [currentSlug, items]);

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
            const label = item.switcherTitle || item.shortTitle || item.title;

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