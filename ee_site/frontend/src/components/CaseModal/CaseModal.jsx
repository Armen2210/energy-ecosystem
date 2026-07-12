// =========================================================
// CASE MODAL / МОДАЛЬНОЕ ОКНО КЕЙСА
//
// Открывает кейс поверх страницы, с которой пришёл пользователь.
//
// Отвечает за:
// - модальную оболочку;
// - закрытие по крестику;
// - закрытие по клику на фон;
// - закрытие клавишей Escape;
// - блокировку прокрутки фоновой страницы;
// - удержание фокуса внутри модального окна;
// - возврат пользователя к исходной карточке.
//
// Галерея и содержание кейса находятся
// в общем компоненте CaseView.
// =========================================================

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import CaseView from "../CaseView";

import { cases } from "../../data/cases";

function CaseModal() {
  const { slug } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const caseItem = cases.find((item) => item.slug === slug);

  const modalOrigin = location.state?.modalOrigin;

  const modalPanelRef = useRef(null);
  const closeButtonRef = useRef(null);

  const handleClose = useCallback(() => {
    const returnPath = modalOrigin
      ? `${modalOrigin.pathname}${modalOrigin.search || ""}`
      : "/cases";

    navigate(returnPath, {
      replace: true,
      state: {
        caseReturn: {
          slug: caseItem?.slug || slug,
          scrollY: modalOrigin?.scrollY ?? 0,
        },
      },
    });
  }, [caseItem?.slug, modalOrigin, navigate, slug]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement;

    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleClose();

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        modalPanelRef.current?.querySelectorAll(
          [
            "button:not([disabled])",
            "a[href]",
            "input:not([disabled])",
            "textarea:not([disabled])",
            "select:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(", ")
        );

      if (!focusableElements?.length) {
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();

        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);

      previouslyFocusedElement?.focus?.();
    };
  }, [handleClose]);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <Navigate to="/cases" replace />;
  }

  const handleCtaClick = () => {
    const backgroundPathname =
      location.state?.backgroundLocation?.pathname;

    if (backgroundPathname === "/cases") {
      navigate("/#contacts", {
        state: {
          entryScroll: "contacts-direct",
        },
      });

      return;
    }

    navigate("/#contacts");
  };

  return (
    <div
      className="case-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-modal-title"
    >
      <div
        className="case-modal__backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={modalPanelRef}
        className="case-modal__panel"
      >
        <button
          ref={closeButtonRef}
          className="case-modal__close"
          type="button"
          onClick={handleClose}
          aria-label="Закрыть кейс"
        >
          <span aria-hidden="true" />
        </button>

        <CaseView
          caseItem={caseItem}
          onCtaClick={handleCtaClick}
          titleId="case-modal-title"
        />
      </div>
    </div>
  );
}

export default CaseModal;